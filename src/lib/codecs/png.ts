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
		// oxipng encodes AND optimizes in one pass; level 1-6 (4+ can be slow)
		const level = clampLevel(opts.effort ?? 4);
		const buffer = await optimise(createImageData(rgba), { level });
		return arrayBufferToBlob(buffer, 'image/png');
	},

	async decode(data: ArrayBuffer): Promise<RGBA> {
		return fromImageData(await decodePng(data));
	},

	// Re-optimize an existing PNG (used later by the "optimize only" pipeline)
	async optimize(blob: Blob, level = 4): Promise<Blob> {
		const buffer = await optimise(await blob.arrayBuffer(), { level: clampLevel(level) });
		return arrayBufferToBlob(buffer, 'image/png');
	}
};
