import { expect, test } from '@playwright/test';

test('app is installable and works fully offline', async ({ page }) => {
	// 1) first visit: the app loads, the SW registers and controls the page
	await page.goto('/');
	await page.evaluate(() => navigator.serviceWorker.ready);
	await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

	// 2) installable: manifest present in the DOM
	const manifest = await page.evaluate(() =>
		document.querySelector('link[rel="manifest"]')?.getAttribute('href')
	);
	expect(manifest).toBeTruthy();

	// wait until the precache is actually filled (wasm downloads)
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

	// an online reload so this navigation is controlled by the SW
	await page.reload();
	await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

	// 3) cut the network → reload → STILL standing
	const context = page.context();
	await context.setOffline(true);
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Pictiúr' })).toBeVisible();
	await expect(page.locator('input[type="file"]')).toBeAttached();

	await context.setOffline(false);
});
