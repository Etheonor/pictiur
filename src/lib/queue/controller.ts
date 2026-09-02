import type { WorkerJob } from '../workers/codec.worker';
import type { PoolResult } from '../workers/pool';
import type { PipelineOptions } from '../pipeline/job';

export type JobStatus = 'ready' | 'queued' | 'processing' | 'done' | 'error' | 'aborted';

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
	format: string; // target codec (label shown while processing)
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

/** The interface the controller expects from the pool (the real implementation is Phase 2). */
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
	private readonly inputs = new Map<string, QueueJobInput>();

	private readonly createUrl: (blob: Blob) => string;
	private readonly revokeUrl: (url: string) => void;
	private readonly notify: () => void;

	constructor(private readonly deps: QueueControllerDeps) {
		this.createUrl = deps.createObjectUrl ?? ((blob) => URL.createObjectURL(blob));
		this.revokeUrl = deps.revokeObjectUrl ?? ((url) => URL.revokeObjectURL(url));
		this.notify = deps.onChange ?? (() => {});
	}

	/**
	 * Stages files as ready ('ready') WITHOUT processing them: you can add them
	 * one by one and adjust the settings. `start()` actually runs the processing.
	 */
	add(inputs: QueueJobInput[]): string[] {
		const ids: string[] = [];
		for (const input of inputs) {
			const id = genId();
			const job: QueueJob = {
				id,
				name: input.name,
				format: input.options.targetFormat,
				inputSize: input.buffer.byteLength,
				status: 'ready',
				progress: 0
			};
			this.jobs.push(job);
			this.inputs.set(id, input);
			ids.push(id);
		}
		this.notify();
		return ids;
	}

	/**
	 * Starts processing all pending files.
	 * @param options settings applied AT launch time (override the drop-time ones).
	 */
	start(options?: PipelineOptions): void {
		for (const job of this.jobs) {
			if (job.status !== 'ready') continue;
			const input = this.inputs.get(job.id);
			if (!input) continue;
			const eff = options ? { ...input, options } : input;
			// Reflect the launch-time target so the badge/progress match the real output.
			job.format = eff.options.targetFormat;
			job.status = 'queued';
			void this.run(eff, job);
		}
		this.notify();
	}

	hasReady(): boolean {
		return this.jobs.some((j) => j.status === 'ready');
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
		for (const job of this.jobs) {
			if (job.status === 'ready') job.status = 'aborted';
		}
		for (const controller of this.abortControllers.values()) controller.abort();
		// the rejected promise marks each in-flight job 'aborted' via its catch
		this.notify();
	}

	removeJob(id: string): void {
		const index = this.jobs.findIndex((j) => j.id === id);
		if (index < 0) return;
		const [job] = this.jobs.splice(index, 1);
		this.inputs.delete(id);
		if (job.result?.url) this.revokeUrl(job.result.url);
		this.abortControllers.get(id)?.abort();
		this.abortControllers.delete(id);
		this.notify();
	}

	clearFinished(): void {
		for (const job of this.jobs) {
			if (job.status === 'done' || job.status === 'error' || job.status === 'aborted') {
				if (job.result?.url) this.revokeUrl(job.result.url);
				this.inputs.delete(job.id);
			}
		}
		const remaining = this.jobs.filter(
			(j) => j.status === 'ready' || j.status === 'queued' || j.status === 'processing'
		);
		this.jobs.splice(0, this.jobs.length, ...remaining);
		this.notify();
	}
}
