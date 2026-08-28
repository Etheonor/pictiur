import { decode as decodeHeic } from '@discourse/heic';
import { fromImageData } from './image-data';
import type { Codec, RGBA } from './types';

// HEIC/HEIF decoder (iPhone photos). Decode-only: we never encode to HEIC.
export const heicCodec: Codec = {
	id: 'heic',
	label: 'HEIC / HEIF',
	mime: 'image/heic',
	extensions: ['heic', 'heif'],
	kind: 'decode',
	supports: { lossy: true, lossless: false, alpha: false },
	defaultQuality: 100, // unused (never an output format)

	async decode(data: ArrayBuffer): Promise<RGBA> {
		// @discourse/heic returns a direct ImageData → no intermediate blob step.
		return fromImageData(await decodeHeic(data));
	}
};
