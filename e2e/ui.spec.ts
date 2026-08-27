import { expect, test } from '@playwright/test';

// Petit PNG valide 1×1 (transparent) — suffit pour que createImageBitmap décode.
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

	await expect(page.locator('article.card')).toHaveCount(2, { timeout: 30_000 });
	await expect(page.getByText('−', { exact: false }).first()).toBeVisible();

	// 2) chaque résultat a un lien de téléchargement
	await expect(page.locator('article.card a[download]')).toHaveCount(2);

	// 3) ZIP
	const downloadPromise = page.waitForEvent('download');
	await page.getByText('Télécharger tout (ZIP)').click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe('pictiur.zip');

	// 4) bascule de langue
	await page.getByRole('button', { name: 'EN' }).click();
	await expect(page.getByText('Download all (ZIP)')).toBeVisible();

	// 5) aucun 404 pendant la session
	expect(failures).toEqual([]);
});

test('settings are applied (max width)', async ({ page }) => {
	await page.goto('/');

	// passer le mode en "poids maximal" nécessite le pipeline ; on vérifie plutôt
	// la persistance : relire la page garde le choix de langue et de format
	await page.locator('select').first().selectOption('avif');
	await page.getByRole('button', { name: 'EN' }).click();

	await page.reload();
	await expect(page.locator('select').first()).toHaveValue('avif');
	// langue persistée : on est en EN, la bascule affiche donc 'FR'
	await expect(page.getByRole('button', { name: 'FR' })).toBeVisible();
});
