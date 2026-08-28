import type { Codec, EncodeOptions, RGBA } from '../codecs/types';
import { flattenAlpha, hasAlpha } from './normalize';

export async function encodeRgba(rgba: RGBA, codec: Codec, options: EncodeOptions): Promise<Blob> {
	if (!codec.encode) {
		throw new Error(`CODEC_NO_ENCODE: ${codec.id}`);
	}
	let target = rgba;
	if (!codec.supports.alpha && hasAlpha(target)) {
		target = flattenAlpha(target, [255, 255, 255]);
	}
	return codec.encode(target, options);
}
