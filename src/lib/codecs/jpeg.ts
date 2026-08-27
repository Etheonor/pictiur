import { decode as decodeJpeg, encode as encodeJpeg } from '@jsquash/jpeg';
import { arrayBufferToBlob, createImageData, fromImageData } from './image-data';
import type { Codec, EncodeOptions, RGBA } from './types';

export const jpegCodec: Codec = {
	id: 'jpeg',
	label: 'JPEG',
	mime: 'image/jpeg',
	extensions: ['jpg', 'jpeg', 'jfif'],
	kind: 'both',
	supports: { lossy: true, lossless: false, alpha: false, progressive: true },
	defaultQuality: 80,

	async encode(rgba: RGBA, opts: EncodeOptions): Promise<Blob> {
		const buffer = await encodeJpeg(createImageData(rgba), { quality: opts.quality });
		return arrayBufferToBlob(buffer, 'image/jpeg');
	},

	async decode(data: ArrayBuffer): Promise<RGBA> {
		return fromImageData(await decodeJpeg(data));
	}
};
