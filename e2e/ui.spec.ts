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

	// 1) les fichiers sont mis EN ATTENTE (pas de traitement automatique au drop)
	await expect(page.locator('article')).toHaveCount(2, { timeout: 30_000 });
	await expect(page.getByText('Prêt').first()).toBeVisible();

	// 2) on lance le traitement
	await page.getByText(/Lancer le traitement \(2\)/).click();

	// 3) la sortie est plus petite (−X %) OU pas meilleure que l'original (note « original ») :
	// l'un des deux indicateurs est toujours affiché dans le résultat.
	const cards = page.locator('article');
	await expect(cards).toHaveCount(2);
	await expect(cards.first()).toContainText(/−\s?\d+ %|original/i, { timeout: 30_000 });

	// 4) chaque résultat a au moins un lien de téléchargement (l'original est proposé
	// en plus si la sortie n'est pas plus petite)
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

	// Le format est choisi via des pills radio ; on vérifie la persistance :
	// relire la page garde le choix de format et de langue.
	await page.getByRole('radio', { name: 'AVIF' }).click();
	await page.getByRole('button', { name: 'EN' }).click();

	await page.reload();
	await expect(page.getByRole('radio', { name: 'AVIF' })).toBeChecked();
	// langue persistée : on est en EN, la bascule affiche donc 'FR'
	await expect(page.getByRole('button', { name: 'FR' })).toBeVisible();
});
