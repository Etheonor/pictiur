import { describe, expect, it, vi } from 'vitest';
import { JobQueueController, type QueueJobInput } from '../controller';
import type { PoolResult } from '../../workers/pool';

class FakePool {
	submitted: { id: string; options: unknown; signal?: AbortSignal }[] = [];
	private readonly delay: number;
	constructor(
		delay = 0,
		private fail = false
	) {
		this.delay = delay;
	}
	submit(args: {
		payload: { id: string; options: unknown };
		signal?: AbortSignal;
	}): Promise<PoolResult> {
		this.submitted.push({
			id: args.payload.id,
			options: args.payload.options,
			signal: args.signal
		});
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
	it('stages files as ready, then start() runs them to done', async () => {
		const pool = new FakePool(5);
		const onChange = vi.fn();
		const controller = new JobQueueController({ pool: pool as never, onChange });
		const [id] = controller.add([input('a.png')]);
		const job = () => controller.jobs.find((j) => j.id === id)!;

		// The drop runs NOTHING: the file is just staged
		expect(job().status).toBe('ready');
		expect(pool.submitted).toHaveLength(0);

		controller.start();
		expect(job().status).toBe('processing');
		await vi.waitFor(() => expect(job().status).toBe('done'));
		expect(job().result?.width).toBe(10);
		expect(job().result?.url).toBeTruthy();
		expect(job().progress).toBe(100);
		// finished jobs stay listed (individual download)
		expect(controller.jobs).toHaveLength(1);
	});

	it('applies launch-time options over the drop-time ones', async () => {
		const pool = new FakePool(0);
		const controller = new JobQueueController({ pool: pool as never });
		controller.add([input('a.png', 'webp')]); // drop-time setting
		expect(controller.jobs[0].format).toBe('webp');
		controller.start({ targetFormat: 'jpeg', quality: 80 }); // launch-time setting
		// the badge/progress reflect the real launch-time target, not the drop-time one
		expect(controller.jobs[0].format).toBe('jpeg');
		await vi.waitFor(() => expect(pool.submitted).toHaveLength(1));
		expect(pool.submitted[0].options).toMatchObject({ targetFormat: 'jpeg', quality: 80 });
	});

	it('setTransform survives a launch-time re-application of global settings', async () => {
		const pool = new FakePool(0);
		const controller = new JobQueueController({ pool: pool as never });
		const [id] = controller.add([input('a.png', 'webp')]);
		controller.setTransform(id, { rotate: 90, flipH: true, flipV: false });
		controller.start({ targetFormat: 'jpeg', quality: 80 });
		await vi.waitFor(() => expect(pool.submitted).toHaveLength(1));
		expect(pool.submitted[0].options).toMatchObject({
			targetFormat: 'jpeg',
			transform: { rotate: 90, flipH: true }
		});
	});

	it('setTransform defaults to identity when never set', async () => {
		const pool = new FakePool(0);
		const controller = new JobQueueController({ pool: pool as never });
		controller.add([input('a.png', 'webp')]);
		controller.start({ targetFormat: 'jpeg' });
		await vi.waitFor(() => expect(pool.submitted).toHaveLength(1));
		expect((pool.submitted[0].options as { transform?: unknown }).transform).toEqual({
			rotate: 0,
			flipH: false,
			flipV: false
		});
	});

	it('setTransform is a no-op once the job has launched (frozen at start)', async () => {
		const pool = new FakePool(30); // stays in-flight
		const controller = new JobQueueController({ pool: pool as never });
		const [id] = controller.add([input('a.png', 'webp')]);
		controller.setTransform(id, { rotate: 90 });
		controller.start();
		await vi.waitFor(() => expect(pool.submitted).toHaveLength(1));
		// launched → a later setTransform must not affect the in-flight job's payload
		controller.setTransform(id, { rotate: 270 });
		expect((pool.submitted[0].options as { transform?: unknown }).transform).toEqual({
			rotate: 90
		});
	});

	it('marks a job as error when the pool rejects', async () => {
		const pool = new FakePool(1, true);
		const controller = new JobQueueController({ pool: pool as never });
		const [id] = controller.add([input('a.png')]);
		controller.start();
		await vi.waitFor(() => expect(controller.jobs.find((j) => j.id === id)!.status).toBe('error'));
		expect(controller.jobs.find((j) => j.id === id)!.error).toBe('BOOM');
	});

	it('aborts all jobs (status aborted)', async () => {
		const pool = new FakePool(50);
		const controller = new JobQueueController({ pool: pool as never });
		controller.add([input('a.png'), input('b.png')]);
		controller.abortAll(); // files never started → aborted immediately
		await vi.waitFor(() => expect(controller.jobs.every((j) => j.status === 'aborted')).toBe(true));

		// aborted while processing
		controller.add([input('c.png')]);
		controller.start();
		await vi.waitFor(() => expect(controller.jobs[2].status).toBe('processing'));
		controller.abortAll();
		await vi.waitFor(() => expect(controller.jobs[2].status).toBe('aborted'));
	});

	it('clearFinished removes done jobs and revokes object urls, keeps ready', async () => {
		const pool = new FakePool(0);
		const revoke = vi.fn();
		const controller = new JobQueueController({
			pool: pool as never,
			revokeObjectUrl: revoke
		});
		controller.add([input('done.png')]);
		controller.start({ targetFormat: 'webp' });
		// file added AFTER launch → stays staged
		controller.add([input('pending.png')]);
		await vi.waitFor(() => expect(controller.jobs[0].status).toBe('done'));
		expect(controller.jobs[1].status).toBe('ready');
		controller.clearFinished();
		expect(controller.jobs).toHaveLength(1);
		expect(controller.jobs[0].name).toBe('pending.png');
		expect(revoke).toHaveBeenCalledTimes(1);
	});

	it('removeJob removes a staged file and a done job', async () => {
		const pool = new FakePool(0);
		const revoke = vi.fn();
		const controller = new JobQueueController({ pool: pool as never, revokeObjectUrl: revoke });
		controller.add([input('staged.png'), input('done.png')]);
		controller.removeJob(controller.jobs[0].id); // file never launched
		expect(controller.jobs).toHaveLength(1);
		controller.start();
		await vi.waitFor(() => expect(controller.jobs[0].status).toBe('done'));
		controller.removeJob(controller.jobs[0].id);
		expect(controller.jobs).toHaveLength(0);
		expect(revoke).toHaveBeenCalledTimes(1);
	});
});
