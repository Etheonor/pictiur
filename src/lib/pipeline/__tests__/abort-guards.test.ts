import { describe, expect, it, vi } from 'vitest';
import type { Codec, RGBA } from '../../codecs/types';
import { LIMITS } from '../job';
import { runPipeline } from '../index';

const fakeRgba = (w: number, h: number): RGBA => ({
	width: w,
	height: h,
	data: new Uint8ClampedArray(0)
});
const fakeCodec = (): Codec => ({
	id: 'fake',
	label: 'Fake',
	mime: 'image/jpeg',
	extensions: ['jpg'],
	kind: 'encode',
	supports: { lossy: true, lossless: false, alpha: true },
	defaultQuality: 80,
	encode: vi.fn(async () => new Blob([new Uint8Array(10)]))
});

const baseEnv = (codec: Codec, image: RGBA) => ({
	decode: vi.fn(async () => image),
	resize: vi.fn(async (r: RGBA, w: number, h: number) => ({ width: w, height: h, data: r.data })),
	getCodec: vi.fn(async () => codec)
});

describe('garde-fous mémoire', () => {
	it('rejette au-delà de maxPixels (sans allouer)', async () => {
		const codec = fakeCodec();
		const e = baseEnv(codec, fakeRgba(20_000, 20_000)); // 400 MP
		await expect(
			runPipeline(
				{ file: new Blob([new Uint8Array(1)]), mime: 'image/png', options: { targetFormat: 'fake' } },
				e
			)
		).rejects.toThrow('MAX_PIXELS');
		expect(codec.encode).not.toHaveBeenCalled();
	});
});

describe('annulation coopérative', () => {
	it('stoppe dès la fin du decode (encode non appelé)', async () => {
		const codec = fakeCodec();
		let cancelled = false;
		const e = { ...baseEnv(codec, fakeRgba(8, 8)), shouldCancel: () => cancelled };
		const p = runPipeline(
			{ file: new Blob([new Uint8Array(1)]), mime: 'image/png', options: { targetFormat: 'fake' } },
			e
		);
		cancelled = true;
		await expect(p).rejects.toThrow('ABORTED');
		expect(codec.encode).not.toHaveBeenCalled();
	});

	it('stoppe pendant la boucle budget (pas de probe supplémentaire)', async () => {
		let cancelled = false;
		const encode = vi.fn(async (_r: RGBA, o: { quality?: number }) => {
			cancelled = true; // la 1re probe déclenche l'annulation
			return new Blob([new Uint8Array(100)]);
		});
		const codec: Codec = { ...fakeCodec(), encode: encode as never };
		const e = { ...baseEnv(codec, fakeRgba(64, 64)), shouldCancel: () => cancelled };
		await expect(
			runPipeline(
				{
					file: new Blob([new Uint8Array(1)]),
					mime: 'image/png',
					options: { targetFormat: 'fake', maxWeightKB: 10 }
				},
				e
			)
		).rejects.toThrow('ABORTED');
		expect(encode).toHaveBeenCalledTimes(1); // pas de 2e probe après cancel
	});
});