import { describe, expect, it } from 'vitest';
import { handleWorkerJob } from '../codec.worker';
import type { RGBA } from '../../codecs/types';

const env = () => ({
	decode: async (): Promise<RGBA> => ({
		width: 10,
		height: 8,
		data: new Uint8ClampedArray(10 * 8 * 4).fill(255)
	}),
	getCodec: async () => ({
		id: 'fake',
		label: 'Fake',
		mime: 'image/jpeg',
		extensions: ['jpg'],
		kind: 'encode',
		supports: { lossy: true, lossless: false, alpha: true },
		defaultQuality: 80,
		encode: async () => new Blob([new Uint8Array(64)])
	})
});

describe('handleWorkerJob', () => {
	it('returns a result with a transferred buffer', async () => {
		const job = {
			id: 'j1',
			name: 'photo.png',
			mime: 'image/png',
			buffer: new Uint8Array(32).buffer,
			options: { targetFormat: 'fake' }
		};
		const progress: number[] = [];
		const res = await handleWorkerJob(job, {
			env: env() as never,
			onProgress: (p) => progress.push(p)
		});
		expect(res.kind).toBe('result');
		expect(progress.length).toBeGreaterThan(0);
		if (res.kind === 'result') {
			expect(res.width).toBe(10);
			expect(res.buffer.byteLength).toBeGreaterThan(0);
		}
	});

	it('returns an error response on failure', async () => {
		const job = {
			id: 'j2',
			name: 'x.png',
			mime: 'image/png',
			buffer: new ArrayBuffer(4),
			options: { targetFormat: 'fake' }
		};
		const res = await handleWorkerJob(job, {
			env: { decode: async () => { throw new Error('DECODE_BROKEN'); } } as never
		});
		expect(res).toEqual({ kind: 'error', id: 'j2', error: 'DECODE_BROKEN' });
	});
});