import { expect, test } from '@playwright/test';

test('app is installable and works fully offline', async ({ page }) => {
	// 1) première visite : l'app se charge, le SW s enregistre et contrôle la page
	await page.goto('/');
	await page.evaluate(() => navigator.serviceWorker.ready);
	await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

	// 2) installation : manifest présent dans le DOM
	const manifest = await page.evaluate(
		() => document.querySelector('link[rel="manifest"]')?.getAttribute('href')
	);
	expect(manifest).toBeTruthy();

	// attendre que le precache soit réellement rempli (téléchargement des .wasm)
	await page.waitForFunction(
		async () => {
			const keys = await caches.keys();
			for (const k of keys) {
				const cache = await caches.open(k);
				if (await cache.match('/index.html')) return true;
			}
			return false;
		},
		undefined,
		{ timeout: 60_000 }
	);

	// un reload en ligne pour que cette navigation soit contrôlée par le SW
	await page.reload();
	await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

	// 3) couper le réseau → recharger → TOUJOURS debout
	const context = page.context();
	await context.setOffline(true);
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Pictiúr' })).toBeVisible();
	await expect(page.locator('input[type="file"]')).toBeAttached();

	await context.setOffline(false);
});