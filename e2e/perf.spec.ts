import { expect, test } from '@playwright/test';

test('budget mode on 3 large images: fast and under target', async ({ page }) => {
	// 3 images 3000×2000 in budget mode: several encodings each → can exceed
	// the default Playwright timeout (30 s) on a fresh CI.
	test.setTimeout(240_000);
	await page.goto('/');

	const report = await page.evaluate(async () => {
		const { createBrowserPool } = await import('/src/lib/workers/index.ts');
		const pool = createBrowserPool(2);

		const makeLarge = async (w: number, h: number): Promise<ArrayBuffer> => {
			const canvas = new OffscreenCanvas(w, h);
			const ctx = canvas.getContext('2d')!;
			const img = ctx.createImageData(w, h);
			// gradient + light noise: compressible (the budget can reach the target)
			// but rich enough to force several encodings.
			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					const i = (y * w + x) * 4;
					const r = (x / w) * 255;
					const g = (y / h) * 255;
					img.data[i] = r;
					img.data[i + 1] = g;
					img.data[i + 2] = (r + g) / 2;
					img.data[i + 3] = 255;
				}
			}
			ctx.putImageData(img, 0, 0);
			return canvas
				.convertToBlob({ type: 'image/jpeg', quality: 0.95 })
				.then((b) => b.arrayBuffer());
		};

		const targets = [150, 120, 90]; // Ko
		const results = [];
		for (let i = 0; i < 3; i++) {
			const buffer = await makeLarge(3000, 2000);
			const t0 = performance.now();
			const res = await pool.submit({
				payload: {
					id: `perf-${i}`,
					name: `big-${i}.jpg`,
					mime: 'image/jpeg',
					buffer,
					options: { targetFormat: 'jpeg', maxWeightKB: targets[i] }
				},
				transfer: [buffer]
			});
			const elapsed = performance.now() - t0;
			results.push({
				width: res.width,
				height: res.height,
				inputSize: res.inputSize,
				outputSize: res.outputSize,
				qualityUsed: res.qualityUsed,
				elapsedMs: Math.round(elapsed)
			});
		}
		pool.terminate();
		return results;
	});

	console.log('perf report:', report);

	for (const r of report) {
		expect(r.width).toBe(3000); // no resize requested
		expect(r.qualityUsed).toBeDefined();
		expect(r.outputSize).toBeLessThanOrEqual(150 * 1024 * 1.1); // la plus grosse cible (150 Ko)
		expect(r.elapsedMs).toBeLessThan(30_000); // generous for CI
	}
});
