import { expect, test } from '@playwright/test';

test('worker pool: 5 images through the real pipeline', async ({ page }) => {
	await page.goto('/');

	const report = await page.evaluate(async () => {
		const { createBrowserPool } = await import('/src/lib/workers/index.ts');
		const pool = createBrowserPool(2);

		const makeImage = (w: number, h: number, type: string): Promise<ArrayBuffer> => {
			const canvas = new OffscreenCanvas(w, h);
			const ctx = canvas.getContext('2d')!;
			const grad = ctx.createLinearGradient(0, 0, w, h);
			grad.addColorStop(0, '#ff0000');
			grad.addColorStop(1, '#0000ff');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, w, h);
			// transparence pour tester l'aplatissement alpha avant JPEG
			ctx.fillStyle = 'rgba(0,255,0,0.25)';
			ctx.fillRect(0, 0, w / 2, h / 2);
			return canvas.convertToBlob({ type }).then((blob) => blob.arrayBuffer());
		};

		const inputs = [
			{
				id: 'webp',
				mime: 'image/png',
				buffer: await makeImage(1200, 800, 'image/png'),
				options: { targetFormat: 'webp', quality: 70 }
			},
			{
				id: 'resized',
				mime: 'image/png',
				buffer: await makeImage(1200, 800, 'image/png'),
				options: { targetFormat: 'jpeg', quality: 75, maxWidth: 400 }
			},
			{
				id: 'budget',
				mime: 'image/png',
				buffer: await makeImage(1200, 800, 'image/png'),
				options: { targetFormat: 'jpeg', maxWeightKB: 60 }
			},
			{
				id: 'avif',
				mime: 'image/png',
				buffer: await makeImage(1200, 800, 'image/png'),
				options: { targetFormat: 'avif', quality: 50 }
			},
			{
				id: 'jxl',
				mime: 'image/png',
				buffer: await makeImage(1200, 800, 'image/png'),
				options: { targetFormat: 'jxl', quality: 70 }
			}
		];

		const results = [];
		for (const input of inputs) {
			const res = await pool.submit({ payload: input, transfer: [input.buffer] });
			results.push({
				id: input.id,
				mime: res.mime,
				width: res.width,
				height: res.height,
				inputSize: res.inputSize,
				outputSize: res.outputSize,
				qualityUsed: res.qualityUsed
			});
		}
		pool.terminate();
		return results;
	});

	console.log('pipeline report:', report);
	expect(report).toHaveLength(5);

	for (const r of report) {
		expect(r.outputSize).toBeGreaterThan(0);
		expect(r.outputSize).toBeLessThan(r.inputSize); // lossy formats shrink the gradient
	}
	expect(report[1].width).toBe(400); // maxWidth applied
	expect(report[2].qualityUsed).toBeDefined(); // boucle budget
	expect(report[2].outputSize).toBeLessThanOrEqual(60 * 1024 * 1.1);
});
