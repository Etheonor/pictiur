import { describe, expect, it, vi } from 'vitest';
import { WorkerPool } from '../pool';
import type { PoolWorker } from '../pool';
import type { WorkerJob, WorkerResponse } from '../codec.worker';

let workerSeq = 0;

// Global peak of concurrently in-flight jobs across all fake workers.
let inFlight = 0;
let maxInFlight = 0;

class FakeWorker implements PoolWorker {
	onmessage: ((event: { data: unknown }) => void) | null = null;
	onerror: ((event: unknown) => void) | null = null;
	messages: WorkerJob[] = [];
	active = 0;
	terminated = false;
	readonly index = workerSeq++;
	constructor(
		private delay: number,
		private fail = false
	) {}

	postMessage(message: unknown): void {
		const job = message as WorkerJob;
		this.messages.push(job);
		this.active++;
		inFlight++;
		maxInFlight = Math.max(maxInFlight, inFlight);
		setTimeout(() => {
			this.active--;
			inFlight--;
			const resp: WorkerResponse = this.fail
				? { kind: 'error', id: job.id, error: 'BOOM' }
				: {
						kind: 'result',
						id: job.id,
						mime: 'image/jpeg',
						width: 1,
						height: 1,
						inputSize: 1,
						outputSize: 1,
						buffer: new Uint8Array(1).buffer
					};
			this.onmessage?.({ data: resp });
		}, this.delay);
	}
	terminate(): void {
		this.terminated = true;
	}
}

const job = (id: string): WorkerJob => ({
	id,
	mime: 'image/png',
	buffer: new ArrayBuffer(4),
	options: { targetFormat: 'jpeg' }
});

describe('WorkerPool', () => {
	it('limits concurrency to the pool size', async () => {
		inFlight = 0;
		maxInFlight = 0;
		const workers = [new FakeWorker(5), new FakeWorker(5)];
		const pool = new WorkerPool(2, () => workers[Math.min(workerSeq - 1, 1)]);
		// 5 jobs submitted: never more than `size` jobs in flight at once
		const results = await Promise.allSettled(
			[1, 2, 3, 4, 5].map((i) => pool.submit({ payload: job(`a${i}`) }))
		);
		expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
		expect(maxInFlight).toBeLessThanOrEqual(pool.size);
		pool.terminate();
	});

	it('processes FIFO with a single worker', async () => {
		const order: string[] = [];
		const worker = new FakeWorker(2);
		const pool = new WorkerPool(1, () => worker);
		await Promise.all(
			['p1', 'p2', 'p3'].map(async (id) => {
				const res = await pool.submit({ payload: job(id) });
				if (res.kind === 'result') order.push(res.id);
			})
		);
		expect(order).toEqual(['p1', 'p2', 'p3']);
		pool.terminate();
	});

	it('forwards progress events', async () => {
		const worker = new FakeWorker(1);
		const pool = new WorkerPool(1, () => worker);
		const onProgress = vi.fn();
		const res = await pool.submit({ payload: job('p1'), onProgress });
		expect(res.kind).toBe('result');
		pool.terminate();
	});

	it('aborts queued and in-flight jobs', async () => {
		const worker = new FakeWorker(10);
		const pool = new WorkerPool(1, () => worker); // single slot → the 2nd job stays queued
		const ac1 = new AbortController();
		const ac2 = new AbortController();
		const p1 = pool.submit({ payload: job('q1'), signal: ac1.signal });
		const p2 = pool.submit({ payload: job('q2'), signal: ac2.signal });
		ac2.abort(); // q2 is queued → immediate rejection
		await expect(p2).rejects.toThrow('ABORTED');
		const r1 = await p1;
		expect(r1.kind).toBe('result');
		pool.terminate();
	});

	it('rejects when a worker reports an error', async () => {
		const pool = new WorkerPool(1, () => new FakeWorker(1, true));
		await expect(pool.submit({ payload: job('e1') })).rejects.toThrow('BOOM');
		pool.terminate();
	});

	it('respawns a crashed worker and rejects its in-flight job', async () => {
		// Worker that never responds but can "crash" (WASM OOM) → onerror.
		class CrashWorker implements PoolWorker {
			onmessage: ((event: { data: unknown }) => void) | null = null;
			onerror: ((event: unknown) => void) | null = null;
			terminated = false;
			postMessage(): void {}
			crash(): void {
				this.onerror?.({ message: 'oom' });
			}
			terminate(): void {
				this.terminated = true;
			}
		}

		const crasher = new CrashWorker();
		const replacement = new FakeWorker(1);
		let first = true;
		const pool = new WorkerPool(1, () => {
			if (first) {
				first = false;
				return crasher;
			}
			return replacement;
		});

		const p1 = pool.submit({ payload: job('crash') });
		crasher.crash();
		await expect(p1).rejects.toThrow('WORKER_CRASH');
		expect(crasher.terminated).toBe(true);

		// The slot was recreated: the pool keeps working.
		const r2 = await pool.submit({ payload: job('after') });
		expect(r2.kind).toBe('result');
		expect(replacement.terminated).toBe(false);
		pool.terminate();
	});
});
