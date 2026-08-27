import { loadSettings, sanitizeSettings, type Settings } from './settings';

export {
	ALLOWED_FORMATS,
	DEFAULT_SETTINGS,
	type CompressionMode,
	type FitMode,
	type Settings
} from './settings';

// État réactif global (runes Svelte 5)
export const settings = $state<Settings>(loadSettings());

export function updateSettings(patch: Partial<Settings>): void {
	Object.assign(settings, sanitizeSettings({ ...settings, ...patch }));
}
