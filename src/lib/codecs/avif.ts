import { decode as decodeAvif, encode as encodeAvif } from '@jsquash/avif';
import { arrayBufferToBlob, createImageData, fromImageData } from './image-data';
import type { Codec, EncodeOptions, RGBA } from './types';

export const avifCodec: Codec = {
	id: 'avif',
	label: 'AVIF',
	mime: 'image/avif',
	extensions: ['avif'],
	kind: 'both',
	supports: { lossy: true, lossless: true, alpha: true, progressive: false },
	defaultQuality: 60,

	async encode(rgba: RGBA, opts: EncodeOptions): Promise<Blob> {
		const buffer = await encodeAvif(createImageData(rgba), {
			quality: opts.quality,
			speed: opts.effort ?? 4, // 0-10: lower = faster, higher = better
			lossless: opts.lossless
		});
		return arrayBufferToBlob(buffer, 'image/avif');
	},

	async decode(data: ArrayBuffer): Promise<RGBA> {
		const image = await decodeAvif(data);
		if (!image) throw new Error('AVIF decode failed');
		return fromImageData(image);
	}
};