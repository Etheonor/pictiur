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
		// `effort` is NORMALIZED across codecs: higher = slower, better compression.
		// @jsquash/avif exposes `speed` (0-10) with the OPPOSITE semantics: higher = faster.
		// Mapping: speed = 10 - effort. Default effort 4 → speed 6 (kept size/speed trade-off,
		// ~7× faster than speed 4 for 0 % gain).
		const effort = opts.effort ?? 4;
		const buffer = await encodeAvif(createImageData(rgba), {
			quality: opts.quality,
			speed: 10 - effort,
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
