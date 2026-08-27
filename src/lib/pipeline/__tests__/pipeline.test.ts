import { describe, expect, it, vi } from 'vitest';
import type { Codec, RGBA } from '../../codecs/types';
import { LIMITS } from '../job';
import { runPipeline } from '../index';

const rgba = (w: number, h: number, opaque = true): RGBA => ({
	width: w,
	height: h,
	data: new Uint8ClampedArray(w * h * 4).fill(opaque ? 255 : 0)
});

const fakeCodec = (
	opts: { alpha?: boolean; sizeOf?: (options: { quality?: number }) => number } = {}
): Codec => ({
	id: 'fake',
	label: 'Fake',
	mime: 'image/jpeg',
	extensions: ['jpg'],
	kind: 'encode',
	supports: { lossy: true, lossless: false, alpha: opts.alpha ?? true },
	defaultQuality: 80,
	encode: vi.fn(async (_rgba: RGBA, o: { quality?: number }) => {
		const size = opts.sizeOf ? opts.sizeOf(o) : 100;
		return new Blob([new Uint8Array(size)]);
	})
});

const env = (
	codec: Codec,
	image = rgba(200, 100),
	opts: Partial<Parameters<typeof runPipeline>[1]> = {}
) => ({
	decode: vi.fn(async () => image),
	resize: vi.fn(async (r: RGBA, w: number, h: number) => ({ width: w, height: h, data: r.data })),
	getCodec: vi.fn(async () => codec),
	onProgress: vi.fn(),
	...opts
});

describe('runPipeline', () => {
	it('encodes without resize when the image fits', async () => {
		const codec = fakeCodec();
		const e = env(codec);
		const res = await runPipeline(
			{
				file: new Blob([new Uint8Array(1)]),
				mime: 'image/png',
				options: { targetFormat: 'fake' }
			},
			e
		);
		expect(res.width).toBe(200);
		expect(res.height).toBe(100);
		expect(e.resize).not.toHaveBeenCalled();
		expect((e.onProgress as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0]).toBe(100);
	});

	it('resizes when maxWidth is set', async () => {
		const codec = fakeCodec();
		const e = env(codec);
		await runPipeline(
			{
				file: new Blob([new Uint8Array(1)]),
				mime: 'image/png',
				options: { targetFormat: 'fake', maxWidth: 100 }
			},
			e
		);
		expect(e.resize).toHaveBeenCalled();
	});

	it('flattens alpha before a no-alpha codec encode', async () => {
		const codec = fakeCodec({ alpha: false });
		const e = env(codec, rgba(8, 8, false));
		await runPipeline(
			{
				file: new Blob([new Uint8Array(1)]),
				mime: 'image/png',
				options: { targetFormat: 'fake' }
			},
			e
		);
		const received = (codec.encode as ReturnType<typeof vi.fn>).mock.calls[0][0] as RGBA;
		expect(received.data[3]).toBe(255);
	});

	it('runs the target-size loop when maxWeightKB is set', async () => {
		const codec = fakeCodec({ sizeOf: (o) => Math.max(20, 10_000 / (o.quality ?? 80)) });
		const e = env(codec);
		const res = await runPipeline(
			{
				file: new Blob([new Uint8Array(1)]),
				mime: 'image/png',
				options: { targetFormat: 'fake', maxWeightKB: 40 }
			},
			e
		);
		expect(res.qualityUsed).toBeDefined();
		expect(res.outputSize).toBeLessThanOrEqual(40 * 1024 * 1.1);
	});

	it('rejects oversized files and images (garde-fous)', async () => {
		const codec = fakeCodec();
		const bigFile = { size: LIMITS.maxFileBytes + 1 } as unknown as Blob;
		await expect(
			runPipeline({ file: bigFile, mime: 'image/png', options: { targetFormat: 'fake' } }, env(codec))
		).rejects.toThrow('MAX_FILE_SIZE');

		await expect(
			runPipeline(
				{ file: new Blob([new Uint8Array(1)]), mime: 'image/png', options: { targetFormat: 'fake' } },
				env(codec, rgba(LIMITS.maxDimension + 1, 10))
			)
		).rejects.toThrow('MAX_DIMENSION');
	});

	it('rejects unknown formats', async () => {
		const e = env(fakeCodec());
		e.getCodec = vi.fn(async () => undefined);
		await expect(
			runPipeline(
				{ file: new Blob([new Uint8Array(1)]), mime: 'image/png', options: { targetFormat: 'inconnu' } },
				e
			)
		).rejects.toThrow('UNKNOWN_FORMAT');
	});
});