import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, sanitizeSettings, saveSettings } from '../settings';

function fakeStorage(): Storage {
	const store = new Map<string, string>();
	return {
		getItem: (k) => store.get(k) ?? null,
		setItem: (k, v) => void store.set(k, v),
		removeItem: (k) => void store.delete(k),
		clear: () => store.clear(),
		key: (i) => [...store.keys()][i] ?? null,
		get length() {
			return store.size;
		}
	} as Storage;
}

afterEach(() => vi.unstubAllGlobals());

describe('settings', () => {
	it('sanitizes unknown and out-of-range values', () => {
		const s = sanitizeSettings({
			targetFormat: 'gif',
			quality: 999,
			maxWidth: -5,
			lang: 'de'
		} as never);
		expect(s.targetFormat).toBe(DEFAULT_SETTINGS.targetFormat);
		expect(s.quality).toBe(100);
		expect(s.maxWidth).toBe(0);
		expect(s.lang).toBe(DEFAULT_SETTINGS.lang);
	});

	it('accepts a valid partial', () => {
		const s = sanitizeSettings({ targetFormat: 'avif', quality: 75 });
		expect(s.targetFormat).toBe('avif');
		expect(s.quality).toBe(75);
	});

	it('falls back to defaults on corrupt storage', () => {
		vi.stubGlobal('localStorage', fakeStorage());
		localStorage.setItem('pictiur:settings:v1', '{pas du json');
		expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
	});

	it('round-trips through storage', () => {
		vi.stubGlobal('localStorage', fakeStorage());
		saveSettings({ ...DEFAULT_SETTINGS, targetFormat: 'jxl', quality: 42 });
		expect(loadSettings().targetFormat).toBe('jxl');
		expect(loadSettings().quality).toBe(42);
	});
});