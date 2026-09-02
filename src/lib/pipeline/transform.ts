import type { RGBA } from '../codecs/types';

export type Rotation = 0 | 90 | 180 | 270;

export interface ImageTransform {
	rotate?: Rotation;
	flipH?: boolean;
	flipV?: boolean;
}

export const IDENTITY_TRANSFORM: ImageTransform = { rotate: 0, flipH: false, flipV: false };

export function isIdentity(t: ImageTransform | undefined): boolean {
	if (!t) return true;
	return (t.rotate ?? 0) === 0 && !t.flipH && !t.flipV;
}

/** A Uint32Array view over an RGBA byte buffer (one 32-bit slot per pixel). */
function asPixels(rgba: RGBA): Uint32Array {
	return new Uint32Array(rgba.data.buffer, rgba.data.byteOffset, rgba.data.byteLength >> 2);
}

function clone(rgba: RGBA): RGBA {
	return { width: rgba.width, height: rgba.height, data: new Uint8ClampedArray(rgba.data) };
}

// Rotate 90° clockwise: dest(x, y) = src(y, srcH - 1 - x). Allocates a new buffer.
function rotate90(rgba: RGBA): RGBA {
	const { width: sw, height: sh } = rgba;
	const dw = sh;
	const dh = sw;
	const out = new Uint8ClampedArray(dw * dh * 4);
	const src = asPixels(rgba);
	const dst = new Uint32Array(out.buffer);
	for (let y = 0; y < dh; y++) {
		for (let x = 0; x < dw; x++) {
			dst[y * dw + x] = src[(sh - 1 - x) * sw + y];
		}
	}
	return { width: dw, height: dh, data: out };
}

// Rotate 270° clockwise (= 90° CCW): dest(x, y) = src(srcW - 1 - y, x).
function rotate270(rgba: RGBA): RGBA {
	const { width: sw, height: sh } = rgba;
	const dw = sh;
	const dh = sw;
	const out = new Uint8ClampedArray(dw * dh * 4);
	const src = asPixels(rgba);
	const dst = new Uint32Array(out.buffer);
	for (let y = 0; y < dh; y++) {
		for (let x = 0; x < dw; x++) {
			dst[y * dw + x] = src[x * sw + (sw - 1 - y)];
		}
	}
	return { width: dw, height: dh, data: out };
}

// 180° and the flips mutate the RGBA in place (zero allocation).
function rotate180InPlace(rgba: RGBA): void {
	const px = asPixels(rgba);
	for (let i = 0, n = px.length; i < n / 2; i++) {
		const j = n - 1 - i;
		const t = px[i];
		px[i] = px[j];
		px[j] = t;
	}
}

function flipHInPlace(rgba: RGBA): void {
	const { width: w, height: h } = rgba;
	const px = asPixels(rgba);
	for (let y = 0; y < h; y++) {
		const row = y * w;
		for (let x = 0; x < w / 2; x++) {
			const a = row + x;
			const b = row + (w - 1 - x);
			const t = px[a];
			px[a] = px[b];
			px[b] = t;
		}
	}
}

function flipVInPlace(rgba: RGBA): void {
	const { width: w, height: h } = rgba;
	const px = asPixels(rgba);
	for (let y = 0; y < h / 2; y++) {
		const top = y * w;
		const bot = (h - 1 - y) * w;
		for (let x = 0; x < w; x++) {
			const t = px[top + x];
			px[top + x] = px[bot + x];
			px[bot + x] = t;
		}
	}
}

/**
 * Applies a rotate + flips to an RGBA buffer, returning a NEW RGBA
 * (the input is never mutated). Canonical order — rotate THEN flipH THEN flipV —
 * keeps combos (e.g. 90°+flipH) deterministic and locked by the golden tests.
 */
export function applyTransform(rgba: RGBA, t: ImageTransform): RGBA {
	if (isIdentity(t)) return rgba;
	let cur = clone(rgba);
	switch (t.rotate ?? 0) {
		case 90:
			cur = rotate90(cur);
			break;
		case 180:
			rotate180InPlace(cur);
			break;
		case 270:
			cur = rotate270(cur);
			break;
	}
	if (t.flipH) flipHInPlace(cur);
	if (t.flipV) flipVInPlace(cur);
	return cur;
}
