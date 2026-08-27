import { describe, expect, it, vi } from 'vitest';
import { JobQueueController, type QueueJobInput } from '../controller';
import type { PoolResult } from '../../workers/pool';

class FakePool {
	submitted: { id: string; options: unknown; signal?: AbortSignal }[] = [];
	private readonly delay: number;
	constructor(delay = 0, private fail = false) {
		this.delay = delay;
	}
	submit(args: {
		payload: { id: string; options: unknown };
		signal?: AbortSignal;
	}): Promise<PoolResult> {
		this.submitted.push({ id: args.payload.id, options: args.payload.options, signal: args.signal });
		return new Promise((resolve, reject) => {
			const { signal } = args;
			if (signal?.aborted) {
				reject(new Error('ABORTED'));
				return;
			}
			signal?.addEventListener('abort', () => reject(new Error('ABORTED')), { once: true });
			setTimeout(() => {
				if (this.fail) reject(new Error('BOOM'));
				else
					resolve({
						kind: 'result',
						id: args.payload.id,
						mime: 'image/webp',
						width: 10,
						height: 8,
						inputSize: 1000,
						outputSize: 300,
						buffer: new Uint8Array(300).buffer
					});
			}, this.delay);
		});
	}
}

const input = (name: string, format = 'webp'): QueueJobInput => ({
	name,
	mime: 'image/png',
	buffer: new Uint8Array(1000).buffer,
	options: { targetFormat: format }
});

describe('JobQueueController', () => {
	it('goes queued → processing → done with result and progress', async () => {
		const pool = new FakePool(5);
		const onChange = vi.fn();
		const controller = new JobQueueController({ pool: pool as never, onChange });
		const [id] = controller.add([input('a.png')]);
		const job = () => controller.jobs.find((j) => j.id === id)!;
		expect(job().status).toBe('processing');
		await vi.waitFor(() => expect(job().status).toBe('done'));
		expect(job().result?.width).toBe(10);
		expect(job().result?.url).toBeTruthy();
		expect(job().progress).toBe(100);
		// les jobs terminés restent listés (téléchargement individuel)
		expect(controller.jobs).toHaveLength(1);
	});

	it('passes pipeline options through to the pool', async () => {
		const pool = new FakePool(0);
		const controller = new JobQueueController({ pool: pool as never });
		controller.add([input('a.png', 'avif')]);
		await vi.waitFor(() => expect(pool.submitted).toHaveLength(1));
		expect(pool.submitted[0].options).toMatchObject({ targetFormat: 'avif' });
	});

	it('marks a job as error when the pool rejects', async () => {
		const pool = new FakePool(1, true);
		const controller = new JobQueueController({ pool: pool as never });
		const [id] = controller.add([input('a.png')]);
		await vi.waitFor(() => expect(controller.jobs.find((j) => j.id === id)!.status).toBe('error'));
		expect(controller.jobs.find((j) => j.id === id)!.error).toBe('BOOM');
	});

	it('aborts all jobs (status aborted)', async () => {
		const pool = new FakePool(50);
		const controller = new JobQueueController({ pool: pool as never });
		controller.add([input('a.png'), input('b.png')]);
		controller.abortAll();
		await vi.waitFor(() =>
			expect(controller.jobs.every((j) => j.status === 'aborted')).toBe(true)
		);
	});

	it('clearFinished removes done jobs and revokes object urls', async () => {
		const pool = new FakePool(0);
		const revoke = vi.fn();
		const controller = new JobQueueController({
			pool: pool as never,
			revokeObjectUrl: revoke
		});
		controller.add([input('a.png')]);
		await vi.waitFor(() => expect(controller.jobs[0].status).toBe('done'));
		controller.clearFinished();
		expect(controller.jobs).toHaveLength(0);
		expect(revoke).toHaveBeenCalledTimes(1);
	});
});