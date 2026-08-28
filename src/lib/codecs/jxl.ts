import { decode as decodeJxl, encode as encodeJxl } from '@jsquash/jxl';
import { arrayBufferToBlob, createImageData, fromImageData } from './image-data';
import type { Codec, EncodeOptions, RGBA } from './types';

export const jxlCodec: Codec = {
	id: 'jxl',
	label: 'JPEG XL',
	mime: 'image/jxl',
	extensions: ['jxl'],
	kind: 'both',
	supports: { lossy: true, lossless: true, alpha: true, progressive: true },
	defaultQuality: 75,

	async encode(rgba: RGBA, opts: EncodeOptions): Promise<Blob> {
		// `effort` normalized: higher = slower, better compression (libjxl 1-9).
		const buffer = await encodeJxl(createImageData(rgba), {
			quality: opts.quality,
			effort: opts.effort ?? 7,
			lossless: opts.lossless
		});
		return arrayBufferToBlob(buffer, 'image/jxl');
	},

	async decode(data: ArrayBuffer): Promise<RGBA> {
		return fromImageData(await decodeJxl(data));
	}
};
