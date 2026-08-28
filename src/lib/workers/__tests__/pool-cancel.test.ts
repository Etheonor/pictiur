import { describe, expect, it } from 'vitest';
import { WorkerPool } from '../pool';
import type { PoolWorker } from '../pool';

class FakeWorker implements PoolWorker {
	onmessage: ((event: { data: unknown }) => void) | null = null;
	messages: unknown[] = [];
	terminate(): void {}
	postMessage(message: unknown): void {
		this.messages.push(message);
		const job = message as { id: string };
		// reply like a worker that is still running
		setTimeout(() => {
			this.onmessage?.({
				data: {
					kind: 'result',
					id: job.id,
					mime: 'image/jpeg',
					width: 1,
					height: 1,
					inputSize: 1,
					outputSize: 1,
					buffer: new Uint8Array(1).buffer
				}
			});
		}, 30);
	}
}

describe('pool → cancel message', () => {
	it('sends {kind:"cancel"} to the worker of an in-flight cancelled job', async () => {
		const worker = new FakeWorker();
		const pool = new WorkerPool(1, () => worker);
		const ac = new AbortController();
		const p = pool.submit({
			payload: {
				id: 'x',
				mime: 'image/png',
				buffer: new ArrayBuffer(4),
				options: { targetFormat: 'jpeg' }
			},
			signal: ac.signal
		});
		await new Promise((r) => setTimeout(r, 5)); // let the job get dispatched
		ac.abort();
		await expect(p).rejects.toThrow('ABORTED');
		await new Promise((r) => setTimeout(r, 50));
		expect(worker.messages.some((m) => (m as { kind?: string }).kind === 'cancel')).toBe(true);
		pool.terminate();
	});
});
