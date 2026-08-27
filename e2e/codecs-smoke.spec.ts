import { expect, test } from '@playwright/test';

test('all jsquash codecs encode in the browser', async ({ page }) => {
	await page.goto('/');

	const report = await page.evaluate(async () => {
		// dynamic import resolved AT RUNTIME by Vite dev server (no static module resolution)
		const src = '/src/lib/codecs/index.ts';
		const { getCodec } = await import(src);

		const out: Record<string, string> = {};
		for (const id of ['jpeg', 'webp', 'png', 'avif', 'jxl']) {
			const codec = await getCodec(id);
			if (!codec) {
				out[id] = 'MISSING';
				continue;
			}
			const rgba = {
				width: 16,
				height: 16,
				data: new Uint8ClampedArray(16 * 16 * 4).fill(128)
			};
			const blob = await codec.encode(rgba, { quality: 75 });
			out[id] = `${codec.mime}:${blob.size}B`;
		}
		return out;
	});

	expect(report.jpeg).toContain('image/jpeg');
	expect(report.webp).toContain('image/webp');
	expect(report.png).toContain('image/png');
	expect(report.avif).toContain('image/avif');
	expect(report.jxl).toContain('image/jxl');
	console.log('codec smoke:', report);
});