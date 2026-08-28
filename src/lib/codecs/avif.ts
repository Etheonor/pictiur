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
		// `effort` est NORMALISÉ à travers les codecs : plus haut = plus lent, meilleure compression.
		// @jsquash/avif expose `speed` (0-10) avec la sémantique OPPOSÉE : plus haut = plus rapide.
		// Mapping : speed = 10 - effort. Défaut effort 4 → speed 6 (compromis taille/vitesse retenu,
		// ~7× plus rapide que speed 4 pour 0 % de gain).
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
