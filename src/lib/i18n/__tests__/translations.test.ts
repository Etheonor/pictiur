import { describe, expect, it } from 'vitest';
import { t, translations } from '../translations';

describe('i18n', () => {
	it('translates known keys in both languages', () => {
		expect(t('fr', 'app.title')).toBeTruthy();
		expect(t('en', 'app.title')).toBeTruthy();
		expect(t('fr', 'app.title')).not.toBe(t('en', 'app.title'));
	});

	it('interpolates variables', () => {
		expect(t('fr', 'result.saved', { pct: '42' })).toContain('42');
	});

	it('falls back to English for missing keys or languages', () => {
		expect(t('de', 'app.title')).toBe(t('en', 'app.title'));
		expect(t('en', 'cle.inexistante')).toBe('cle.inexistante');
	});

	it('keeps fr/en key sets identical (no missing translations)', () => {
		const frKeys = Object.keys(translations.fr).sort();
		const enKeys = Object.keys(translations.en).sort();
		expect(frKeys).toEqual(enKeys);
	});
});
