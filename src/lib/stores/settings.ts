export type CompressionMode = 'quality' | 'weight';
export type FitMode = 'contain' | 'cover' | 'fill';

export interface Settings {
	targetFormat: string; // codec id ('webp' by default)
	compressMode: CompressionMode;
	quality: number; // 0-100
	maxWidth: number; // 0 = no limit
	maxHeight: number; // 0 = no limit
	fit: FitMode;
	maxWeightKB: number;
	lang: 'fr' | 'en';
}

export const STORAGE_KEY = 'pictiur:settings:v1';

export const ALLOWED_FORMATS = ['jpeg', 'webp', 'png', 'avif', 'jxl'];
const FITS: FitMode[] = ['contain', 'cover', 'fill'];
const LANGS = ['fr', 'en'];

export const DEFAULT_SETTINGS: Settings = {
	targetFormat: 'webp',
	compressMode: 'quality',
	quality: 80,
	maxWidth: 0,
	maxHeight: 0,
	fit: 'contain',
	maxWeightKB: 200,
	lang: 'fr'
};

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));
const intOr = (v: unknown, fallback: number): number =>
	typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : fallback;

/** Sanitizes any input (corrupted localStorage, third-party JSON…) → valid Settings. */
export function sanitizeSettings(value: Partial<Settings> | unknown): Settings {
	const v = (value ?? {}) as Partial<Settings>;
	return {
		targetFormat: ALLOWED_FORMATS.includes(v.targetFormat ?? '')
			? v.targetFormat!
			: DEFAULT_SETTINGS.targetFormat,
		compressMode: v.compressMode === 'weight' ? 'weight' : 'quality',
		quality:
			typeof v.quality === 'number'
				? clamp(Math.round(v.quality), 0, 100)
				: DEFAULT_SETTINGS.quality,
		maxWidth: intOr(v.maxWidth, DEFAULT_SETTINGS.maxWidth),
		maxHeight: intOr(v.maxHeight, DEFAULT_SETTINGS.maxHeight),
		fit: (FITS as readonly string[]).includes(v.fit ?? '') ? v.fit! : DEFAULT_SETTINGS.fit,
		maxWeightKB: clamp(intOr(v.maxWeightKB, DEFAULT_SETTINGS.maxWeightKB), 1, 100_000),
		lang: LANGS.includes(v.lang ?? '') && v.lang === 'en' ? 'en' : 'fr'
	};
}

export function loadSettings(): Settings {
	if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? sanitizeSettings(JSON.parse(raw)) : { ...DEFAULT_SETTINGS };
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

export function saveSettings(settings: Settings): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)));
	} catch {
		// storage full/disabled: ignore, the app stays usable
	}
}
