import { decode as decodePng } from '@jsquash/png';
import { optimise } from '@jsquash/oxipng';
import { arrayBufferToBlob, createImageData, fromImageData } from './image-data';
import type { Codec, EncodeOptions, RGBA } from './types';

const clampLevel = (n: number) => Math.min(6, Math.max(1, Math.round(n)));

export const pngCodec: Codec = {
	id: 'png',
	label: 'PNG',
	mime: 'image/png',
	extensions: ['png'],
	kind: 'both',
	supports: { lossy: false, lossless: true, alpha: true },
	defaultQuality: 100,

	async encode(rgba: RGBA, opts: EncodeOptions): Promise<Blob> {
		// oxipng: level 1-6 (4+ uses zopfli → very slow, ~0% gain on photos).
		// Bench: level 1 = 3× faster than 2 for the same size → default 1.
		const level = clampLevel(opts.effort ?? 1);
		const buffer = await optimise(createImageData(rgba), { level });
		return arrayBufferToBlob(buffer, 'image/png');
	},

	async decode(data: ArrayBuffer): Promise<RGBA> {
		return fromImageData(await decodePng(data));
	},

	// Re-optimize an existing PNG (used later by the "optimize only" pipeline)
	async optimize(blob: Blob, level = 1): Promise<Blob> {
		const buffer = await optimise(await blob.arrayBuffer(), { level: clampLevel(level) });
		return arrayBufferToBlob(buffer, 'image/png');
	}
};
