import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const HEIC = readFileSync('tests/fixtures/heic/sample.heic');

test('decodes a real HEIC and exports it (full UI)', async ({ page }) => {
	const failures: string[] = [];
	page.on('response', (res) => {
		if (res.status() >= 400) failures.push(`${res.status()} ${res.url()}`);
	});

	await page.goto('/');
	await page.locator('input[type="file"]').setInputFiles({
		name: 'sample.heic',
		mimeType: 'image/heic',
		buffer: HEIC
	});

	// staged flow: the file is ready, then we launch the processing
	await expect(page.locator('article')).toHaveCount(1);
	await page.getByText(/Start processing \(1\)/).click();

	// WASM decode + default webp encode → result card
	await expect(page.locator('article.result-card')).toHaveCount(1, { timeout: 60_000 });
	await expect(page.locator('article.result-card a[download]')).toHaveCount(1);

	expect(failures).toEqual([]); // including no .wasm 404
});

test('resolves the heic codec and decodes to RGBA (direct API)', async ({ page }) => {
	await page.goto('/');
	const info = await page.evaluate(async (b64) => {
		const src = '/src/lib/codecs/index.ts';
		const { getCodec } = await import(src);
		const codec = await getCodec('heic');
		if (!codec?.decode) return { ok: false, error: 'no decode' };
		const bin = atob(b64);
		const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
		const rgba = await codec.decode(bytes.buffer);
		return { ok: true, width: rgba.width, height: rgba.height };
	}, HEIC.toString('base64'));

	expect(info.ok).toBe(true);
	expect(info.width).toBeGreaterThan(0);
	expect(info.height).toBeGreaterThan(0);
});
