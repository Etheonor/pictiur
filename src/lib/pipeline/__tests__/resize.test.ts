import { describe, expect, it } from 'vitest';
import { buildResizeSteps, centerCrop, planResize, resizeRgba } from '../resize';
import { gradientRgba } from '../../codecs/test/fixtures';
import { installImageDataPolyfill } from '../../codecs/test/image-data-polyfill';

installImageDataPolyfill();

// Wasm jsquash cannot load in Node (fetch of file:// is not implemented).
// Skipped here; the real proof is the browser pipeline smoke test.
const nodeCannotLoadWasm = true;

describe('planResize (géométrie)', () => {
	it('returns null when the image already fits', () => {
		expect(planResize({ width: 500, height: 300 }, 'contain', 800, 800)).toBeNull();
	});

	it('contain preserves the ratio', () => {
		expect(planResize({ width: 2000, height: 1000 }, 'contain', 800, 800)).toEqual({
			width: 800,
			height: 400
		});
		expect(planResize({ width: 2000, height: 1000 }, 'contain', 500)).toEqual({
			width: 500,
			height: 250
		});
	});

	it('fill forces the box', () => {
		expect(planResize({ width: 2000, height: 1000 }, 'fill', 800, 600)).toEqual({
			width: 800,
			height: 600
		});
	});

	it('cover computes a crop box centered', () => {
		const plan = planResize({ width: 2000, height: 1000 }, 'cover', 800, 800);
		expect(plan).toEqual({ width: 1600, height: 800, crop: { width: 800, height: 800 } });
	});

	it('never upscales', () => {
		expect(planResize({ width: 100, height: 100 }, 'fill', 800, 800)).toBeNull();
	});
});

describe('buildResizeSteps (step-down)', () => {
	it('plans halving steps for huge images', () => {
		const steps = buildResizeSteps(
			{ width: 16_000, height: 8_000 },
			{ width: 2_000, height: 1_000 }
		);
		expect(steps.length).toBeGreaterThan(1);
		for (const s of steps) {
			expect(s.width).toBeGreaterThanOrEqual(2_000);
			expect(s.height).toBeGreaterThanOrEqual(1_000);
		}
		// steps sont décroissants
		for (let i = 1; i < steps.length; i++) {
			expect(steps[i].width).toBeLessThan(steps[i - 1].width);
		}
	});

	it('skips step-down for small images', () => {
		expect(buildResizeSteps({ width: 4000, height: 3000 }, { width: 800, height: 600 })).toEqual(
			[]
		);
	});
});

describe('centerCrop', () => {
	it('crops the center box', () => {
		const rgba = gradientRgba(100, 80);
		const crop = centerCrop(rgba, 40, 40);
		expect(crop.width).toBe(40);
		expect(crop.height).toBe(40);
		// pixel au centre de la source (30, 20) = coin du crop
		const srcIdx = (20 * 100 + 30) * 4;
		const dstIdx = 0;
		expect(crop.data[dstIdx]).toBe(rgba.data[srcIdx]);
	});
});

describe('resizeRgba (wasm — voir Pièges n°5 si échec en Node)', () => {
	it.skipIf(nodeCannotLoadWasm)('downscales and keeps dimensions', async () => {
		const out = await resizeRgba(gradientRgba(8, 8), 4, 4);
		expect(out.width).toBe(4);
		expect(out.height).toBe(4);
		expect(out.data.length).toBe(4 * 4 * 4);
	});
});
