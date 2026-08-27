import type { WorkerJob, WorkerResponse } from './codec.worker';

/** Contrat du worker, minimal et mockable en test. */
export interface PoolWorker {
	postMessage(message: unknown, transfer?: Transferable[]): void;
	onmessage: ((event: { data: unknown }) => void) | null;
	terminate(): void;
}

export interface PoolSubmit {
	payload: WorkerJob;
	transfer?: Transferable[];
	onProgress?: (progress: number) => void;
	signal?: AbortSignal;
}

export type PoolResult = Extract<WorkerResponse, { kind: 'result' }>;

interface JobRecord {
	submit: PoolSubmit;
	resolve: (result: PoolResult) => void;
	reject: (error: Error) => void;
}

let seq = 0;
const genId = (): string => `job-${++seq}-${Date.now()}`;

export class WorkerPool {
	private readonly workers: PoolWorker[];
	private readonly busy: boolean[];
	private readonly queue: JobRecord[] = [];
	private readonly inflight = new Map<string, JobRecord>();
	private done = false;

	constructor(size: number, createWorker: () => PoolWorker) {
		this.workers = Array.from({ length: Math.max(1, size) }, () => createWorker());
		this.busy = this.workers.map(() => false);
		this.workers.forEach((worker, index) => {
			worker.onmessage = (event) => this.onMessage(index, event.data as WorkerResponse);
		});
	}

	get size(): number {
		return this.workers.length;
	}

	submit(submit: PoolSubmit): Promise<PoolResult> {
		return new Promise((resolve, reject) => {
			const id = submit.payload.id || genId();
			const payload: WorkerJob = { ...submit.payload, id };
			const record: JobRecord = { submit: { ...submit, payload }, resolve, reject };

			if (submit.signal?.aborted) {
				reject(new Error('ABORTED'));
				return;
			}
			submit.signal?.addEventListener(
				'abort',
				() => {
					if (this.inflight.has(id)) {
						this.inflight.delete(id); // le résultat arrivera, on l'ignore
						reject(new Error('ABORTED'));
					} else {
						const queueIndex = this.queue.findIndex((j) => j.submit.payload.id === id);
						if (queueIndex >= 0) {
							this.queue.splice(queueIndex, 1);
							reject(new Error('ABORTED'));
						}
					}
				},
				{ once: true }
			);

			this.queue.push(record);
			this.dispatch();
		});
	}

	private dispatch(): void {
		if (this.done) return;
		for (let i = 0; i < this.workers.length; i++) {
			if (this.busy[i] || this.queue.length === 0) continue;
			const record = this.queue.shift()!;
			this.busy[i] = true;
			this.inflight.set(record.submit.payload.id, record);
			this.workers[i].postMessage(record.submit.payload, record.submit.transfer);
		}
	}

	private onMessage(index: number, response: WorkerResponse): void {
		if (response.kind === 'progress') {
			this.inflight.get(response.id)?.submit.onProgress?.(response.progress);
			return;
		}
		const record = this.inflight.get(response.id);
		this.inflight.delete(response.id);
		this.busy[index] = false;
		if (record) {
			if (response.kind === 'result') record.resolve(response);
			else record.reject(new Error(response.error));
		}
		this.dispatch();
	}

	terminate(): void {
		this.done = true;
		for (const worker of this.workers) worker.terminate();
		for (const [, record] of this.inflight) record.reject(new Error('TERMINATED'));
		for (const record of this.queue.splice(0)) record.reject(new Error('TERMINATED'));
		this.inflight.clear();
	}
}