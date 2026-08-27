import { decode as decodeWebp, encode as encodeWebp } from '@jsquash/webp';
import { arrayBufferToBlob, createImageData, fromImageData } from './image-data';
import type { Codec, EncodeOptions, RGBA } from './types';

export const webpCodec: Codec = {
	id: 'webp',
	label: 'WebP',
	mime: 'image/webp',
	extensions: ['webp'],
	kind: 'both',
	supports: { lossy: true, lossless: true, alpha: true, progressive: false },
	defaultQuality: 80,

	async encode(rgba: RGBA, opts: EncodeOptions): Promise<Blob> {
		const buffer = await encodeWebp(createImageData(rgba), {
			quality: opts.quality,
			lossless: opts.lossless ? 1 : 0
		});
		return arrayBufferToBlob(buffer, 'image/webp');
	},

	async decode(data: ArrayBuffer): Promise<RGBA> {
		return fromImageData(await decodeWebp(data));
	}
};