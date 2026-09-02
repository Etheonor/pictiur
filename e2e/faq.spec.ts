import { expect, test } from '@playwright/test';

test('FAQ is reachable from the header and renders a full page', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'FAQ' }).click();
	await expect(page).toHaveURL(/\/faq\/?$/);
	await expect(page.getByRole('heading', { name: 'FAQ', level: 1 })).toBeVisible();
	// a real, readable answer (not an accordion — content is directly present)
	await expect(page.getByText('What about EXIF / GPS metadata?')).toBeVisible();
	await expect(
		page.getByText(/never kept|ré-encodons|re-encode/i, { exact: false }).first()
	).toBeVisible();
});