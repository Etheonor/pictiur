import { describe, expect, it } from 'vitest';
import { flattenAlpha, hasAlpha } from '../normalize';

const opaque = () => ({ width: 1, height: 1, data: new Uint8ClampedArray([10, 20, 30, 255]) });
const semi = () => ({ width: 1, height: 1, data: new Uint8ClampedArray([128, 0, 0, 128]) });

describe('hasAlpha', () => {
	it('detects transparency', () => {
		expect(hasAlpha(semi())).toBe(true);
		expect(hasAlpha(opaque())).toBe(false);
	});
});

describe('flattenAlpha', () => {
	it('composites onto a background and forces alpha 255', () => {
		const out = flattenAlpha(semi(), [255, 255, 255]);
		// 128*128/255 + 255*(1-128/255) ≈ 64 + 127 = 191
		expect(out.data[0]).toBe(191);
		expect(out.data[3]).toBe(255);
	});
});