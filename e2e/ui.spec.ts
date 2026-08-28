import { expect, test } from '@playwright/test';

// Tiny valid 1×1 PNG (transparent) — enough for createImageBitmap to decode.
const TINY_PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
	'base64'
);

test('drop files → results → zip download', async ({ page }) => {
	const failures: string[] = [];
	page.on('response', (res) => {
		if (res.status() >= 400) failures.push(`${res.status()} ${res.url()}`);
	});

	await page.goto('/');

	// 1) format webp par défaut — drop 2 fichiers
	const input = page.locator('input[type="file"]');
	await input.setInputFiles([
		{ name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG },
		{ name: 'logo.png', mimeType: 'image/png', buffer: TINY_PNG }
	]);

	// 1) files are STAGED (no automatic processing on drop)
	await expect(page.locator('article')).toHaveCount(2, { timeout: 30_000 });
	await expect(page.getByText('Prêt').first()).toBeVisible();

	// 2) on lance le traitement
	await page.getByText(/Lancer le traitement \(2\)/).click();

	// 3) the output is smaller (−X %) OR not better than the original (« original » note):
	// one of the two indicators is always shown in the result.
	const cards = page.locator('article');
	await expect(cards).toHaveCount(2);
	await expect(cards.first()).toContainText(/−\s?\d+ %|original/i, { timeout: 30_000 });

	// 4) each result has at least one download link (the original is also offered
	// when the output is not smaller)
	await expect(cards.first().locator('a[download]').first()).toBeVisible();
	await expect(cards.nth(1).locator('a[download]').first()).toBeVisible();

	// 5) ZIP
	const downloadPromise = page.waitForEvent('download');
	await page.getByText('Télécharger tout (ZIP)').click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe('pictiur.zip');

	// 6) bascule de langue
	await page.getByRole('button', { name: 'EN' }).click();
	await expect(page.getByText('Download all (ZIP)')).toBeVisible();

	// 7) aucun 404 pendant la session
	expect(failures).toEqual([]);
});

test('settings persist (format + language)', async ({ page }) => {
	await page.goto('/');

	// The format is chosen via radio pills; we check persistence:
	// reloading the page keeps the format and language choices.
	await page.getByRole('radio', { name: 'AVIF' }).click();
	await page.getByRole('button', { name: 'EN' }).click();

	await page.reload();
	await expect(page.getByRole('radio', { name: 'AVIF' })).toBeChecked();
	// language persisted: we are in EN, so the toggle shows 'FR'
	await expect(page.getByRole('button', { name: 'FR' })).toBeVisible();
});
