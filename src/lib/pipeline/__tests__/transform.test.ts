import { describe, expect, it } from 'vitest';
import type { RGBA } from '../../codecs/types';
import { resolveOptions, validateOptions } from '../job';
import { IDENTITY_TRANSFORM, applyTransform, isIdentity } from '../transform';

// Build a WxH RGBA whose pixel ids are the given row-major values (1..6 for a 2x3).
function grid(w: number, h: number, ids: number[]): RGBA {
	const data = new Uint8ClampedArray(w * h * 4);
	new Uint32Array(data.buffer).set(ids);
	return { width: w, height: h, data };
}
function pixelIds(rgba: RGBA): number[] {
	const view = new Uint32Array(rgba.data.buffer, rgba.data.byteOffset, rgba.data.length >> 2);
	return Array.from(view);
}

// Source 2x3 (W=2,H=3):
//   1 2
//   3 4
//   5 6
const SRC = () => grid(2, 3, [1, 2, 3, 4, 5, 6]);

describe('applyTransform (pixel-exact)', () => {
	it('identity returns the pixels unchanged', () => {
		expect(pixelIds(applyTransform(SRC(), IDENTITY_TRANSFORM))).toEqual([1, 2, 3, 4, 5, 6]);
		expect(pixelIds(applyTransform(SRC(), {}))).toEqual([1, 2, 3, 4, 5, 6]);
	});

	it('rotates 90° CW and swaps dimensions (2x3 → 3x2)', () => {
		const out = applyTransform(SRC(), { rotate: 90 });
		expect(out.width).toBe(3);
		expect(out.height).toBe(2);
		expect(pixelIds(out)).toEqual([5, 3, 1, 6, 4, 2]);
	});

	it('rotates 180° in place (dims unchanged)', () => {
		const out = applyTransform(SRC(), { rotate: 180 });
		expect(out.width).toBe(2);
		expect(out.height).toBe(3);
		expect(pixelIds(out)).toEqual([6, 5, 4, 3, 2, 1]);
	});

	it('rotates 270° CW and swaps dimensions (2x3 → 3x2)', () => {
		const out = applyTransform(SRC(), { rotate: 270 });
		expect(out.width).toBe(3);
		expect(out.height).toBe(2);
		expect(pixelIds(out)).toEqual([2, 4, 6, 1, 3, 5]);
	});

	it('flips horizontally (mirrors each row)', () => {
		expect(pixelIds(applyTransform(SRC(), { flipH: true }))).toEqual([2, 1, 4, 3, 6, 5]);
	});

	it('flips vertically (mirrors row order)', () => {
		expect(pixelIds(applyTransform(SRC(), { flipV: true }))).toEqual([5, 6, 3, 4, 1, 2]);
	});

	it('applies canonical order rotate THEN flipH THEN flipV (90 + flipH)', () => {
		// rotate90 → [5,3,1 / 6,4,2]; flipH mirrors each row → [1,3,5 / 2,4,6]
		expect(pixelIds(applyTransform(SRC(), { rotate: 90, flipH: true }))).toEqual([
			1, 3, 5, 2, 4, 6
		]);
	});

	it('does not mutate the input buffer', () => {
		const src = SRC();
		applyTransform(src, { rotate: 90, flipV: true });
		expect(pixelIds(src)).toEqual([1, 2, 3, 4, 5, 6]);
	});
});

describe('isIdentity', () => {
	it('recognizes no-op transforms', () => {
		expect(isIdentity(IDENTITY_TRANSFORM)).toBe(true);
		expect(isIdentity({})).toBe(true);
		expect(isIdentity(undefined)).toBe(true);
		expect(isIdentity({ rotate: 90 })).toBe(false);
		expect(isIdentity({ flipH: true })).toBe(false);
	});
});

describe('transform validation & default', () => {
	it('rejects a non-quadrant rotation', () => {
		expect(validateOptions({ targetFormat: 'webp', transform: { rotate: 45 as never } }).ok).toBe(
			false
		);
	});
	it('accepts quadrant rotations and flips', () => {
		expect(
			validateOptions({
				targetFormat: 'webp',
				transform: { rotate: 180, flipH: true, flipV: false }
			}).ok
		).toBe(true);
	});
	it('defaults to identity when no transform given', () => {
		expect(resolveOptions({ targetFormat: 'webp' }).transform).toEqual(IDENTITY_TRANSFORM);
	});
});
