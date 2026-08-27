import type { RGBA } from '../codecs/types';

export function hasAlpha(rgba: RGBA): boolean {
	const { data } = rgba;
	for (let i = 3; i < data.length; i += 4) {
		if (data[i] < 255) return true;
	}
	return false;
}

/** Composite the RGBA onto a background (alpha baked in), e.g. before JPEG encode. */
export function flattenAlpha(
	rgba: RGBA,
	background: [number, number, number] = [255, 255, 255]
): RGBA {
	const out = new Uint8ClampedArray(rgba.data.length);
	const [br, bg, bb] = background;
	for (let i = 0; i < rgba.data.length; i += 4) {
		const a = rgba.data[i + 3] / 255;
		out[i] = Math.round(rgba.data[i] * a + br * (1 - a));
		out[i + 1] = Math.round(rgba.data[i + 1] * a + bg * (1 - a));
		out[i + 2] = Math.round(rgba.data[i + 2] * a + bb * (1 - a));
		out[i + 3] = 255;
	}
	return { width: rgba.width, height: rgba.height, data: out };
}
