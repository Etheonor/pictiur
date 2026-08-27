import { describe, expect, it } from 'vitest';
import { LIMITS, resolveOptions, validateOptions } from '../job';

describe('job options', () => {
	it('rejects invalid options', () => {
		expect(validateOptions({ targetFormat: '' }).ok).toBe(false);
		expect(validateOptions({ targetFormat: 'jpeg', quality: 150 }).ok).toBe(false);
		expect(validateOptions({ targetFormat: 'jpeg', maxWidth: 0 }).ok).toBe(false);
		expect(validateOptions({ targetFormat: 'webp', effort: 12 }).ok).toBe(false);
	});

	it('accepts valid options', () => {
		const v = validateOptions({
			targetFormat: 'jpeg',
			quality: 80,
			maxWidth: 1200,
			maxWeightKB: 200
		});
		expect(v.ok).toBe(true);
	});

	it('applies defaults (fit contain, quality 80)', () => {
		const r = resolveOptions({ targetFormat: 'webp' });
		expect(r.fit).toBe('contain');
		expect(r.quality).toBe(80);
	});

	it('defines sane safety limits', () => {
		expect(LIMITS.maxDimension).toBe(24_000);
		expect(LIMITS.maxFileBytes).toBeLessThanOrEqual(100 * 1024 * 1024);
		expect(LIMITS.qualityMin).toBe(20);
		expect(LIMITS.qualityMax).toBe(95);
	});
});