import type { WorkerJob } from '../workers/codec.worker';
import type { PoolResult } from '../workers/pool';
import type { PipelineOptions } from '../pipeline/job';

export type JobStatus = 'queued' | 'processing' | 'done' | 'error' | 'aborted';

export interface QueueJobResult {
	blob: Blob;
	mime: string;
	width: number;
	height: number;
	outputSize: number;
	qualityUsed?: number;
	url: string; // object URL
}

export interface QueueJob {
	id: string;
	name: string;
	inputSize: number;
	status: JobStatus;
	progress: number; // 0-100
	error?: string;
	result?: QueueJobResult;
}

export interface QueueJobInput {
	name: string;
	mime: string;
	buffer: ArrayBuffer;
	options: PipelineOptions;
}

/** L'interface que le contrôleur attend du pool (la vraie implémentation est la Phase 2). */
export interface QueuePool {
	submit(args: {
		payload: WorkerJob;
		transfer?: Transferable[];
		onProgress?: (progress: number) => void;
		signal?: AbortSignal;
	}): Promise<PoolResult>;
}

export interface QueueControllerDeps {
	pool: QueuePool;
	createObjectUrl?: (blob: Blob) => string;
	revokeObjectUrl?: (url: string) => void;
	onChange?: () => void;
}

let seq = 0;
const genId = (): string => `ui-${++seq}-${Date.now()}`;

export class JobQueueController {
	readonly jobs: QueueJob[] = [];
	private readonly abortControllers = new Map<string, AbortController>();

	private readonly createUrl: (blob: Blob) => string;
	private readonly revokeUrl: (url: string) => void;
	private readonly notify: () => void;

	constructor(private readonly deps: QueueControllerDeps) {
		this.createUrl = deps.createObjectUrl ?? ((blob) => URL.createObjectURL(blob));
		this.revokeUrl = deps.revokeObjectUrl ?? ((url) => URL.revokeObjectURL(url));
		this.notify = deps.onChange ?? (() => {});
	}

	add(inputs: QueueJobInput[]): string[] {
		const ids: string[] = [];
		for (const input of inputs) {
			const id = genId();
			const job: QueueJob = {
				id,
				name: input.name,
				inputSize: input.buffer.byteLength,
				status: 'queued',
				progress: 0
			};
			this.jobs.push(job);
			ids.push(id);
			void this.run(input, job);
		}
		this.notify();
		return ids;
	}

	private async run(input: QueueJobInput, job: QueueJob): Promise<void> {
		job.status = 'processing';
		this.notify();
		const controller = new AbortController();
		this.abortControllers.set(job.id, controller);
		try {
			const result = await this.deps.pool.submit({
				payload: {
					id: job.id,
					name: input.name,
					mime: input.mime,
					buffer: input.buffer,
					options: input.options
				},
				transfer: [input.buffer],
				onProgress: (progress) => {
					job.progress = progress;
					this.notify();
				},
				signal: controller.signal
			});
			const blob = new Blob([result.buffer], { type: result.mime });
			job.result = {
				blob,
				mime: result.mime,
				width: result.width,
				height: result.height,
				outputSize: result.outputSize,
				qualityUsed: result.qualityUsed,
				url: this.createUrl(blob)
			};
			job.status = 'done';
			job.progress = 100;
		} catch (error) {
			job.status = error instanceof Error && error.message === 'ABORTED' ? 'aborted' : 'error';
			job.error = error instanceof Error ? error.message : String(error);
		} finally {
			this.abortControllers.delete(job.id);
			this.notify();
		}
	}

	abortAll(): void {
		for (const controller of this.abortControllers.values()) controller.abort();
		// la promesse rejetée marque chaque job 'aborted' via son catch
	}

	clearFinished(): void {
		for (const job of this.jobs) {
			if (job.status === 'done' || job.status === 'error' || job.status === 'aborted') {
				if (job.result?.url) this.revokeUrl(job.result.url);
			}
		}
		const remaining = this.jobs.filter((j) => j.status === 'queued' || j.status === 'processing');
		this.jobs.splice(0, this.jobs.length, ...remaining);
		this.notify();
	}
}