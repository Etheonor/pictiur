import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const PNG = readFileSync('tests/fixtures/transform/landscape.png');

test('rotate 90 swaps dimensions; flip keeps them (real pipeline via pool)', async ({ page }) => {
	await page.goto('/');

	const res = await page.evaluate(async (b64) => {
		const { createBrowserPool } = await import('/src/lib/workers/index.ts');
		const pool = createBrowserPool(1);
		const bin = atob(b64);
		const data = Uint8Array.from(bin, (c) => c.charCodeAt(0));

		const b1 = data.slice().buffer;
		const r90 = await pool.submit({
			payload: {
				id: 'r90',
				name: 'l.png',
				mime: 'image/png',
				buffer: b1,
				options: { targetFormat: 'jpeg', transform: { rotate: 90 } }
			},
			transfer: [b1]
		});
		const b2 = data.slice().buffer;
		const fh = await pool.submit({
			payload: {
				id: 'fh',
				name: 'l.png',
				mime: 'image/png',
				buffer: b2,
				options: { targetFormat: 'jpeg', transform: { flipH: true } }
			},
			transfer: [b2]
		});
		pool.terminate();
		return { r90: { w: r90.width, h: r90.height }, fh: { w: fh.width, h: fh.height } };
	}, PNG.toString('base64'));

	expect(res.r90).toEqual({ w: 3, h: 4 }); // 4x3 → 3x4
	expect(res.fh).toEqual({ w: 4, h: 3 }); // flip keeps dims
});

test('per-file rotate button shows a badge then produces the result', async ({ page }) => {
	await page.goto('/');
	await page.locator('input[type="file"]').setInputFiles({
		name: 'landscape.png',
		mimeType: 'image/png',
		buffer: PNG
	});

	// staged: no transform badge yet
	await expect(page.locator('.summary__row')).toHaveCount(1);
	await expect(page.getByText('90°')).toHaveCount(0);

	// rotate right once → badge "90°" + active state
	await page.getByLabel('Rotate right').click();
	await expect(page.getByText('90°')).toBeVisible();

	// launch → result card
	await page.getByText(/Start processing \(1\)/).click();
	await expect(page.locator('article.result-card')).toHaveCount(1, { timeout: 30_000 });
});
