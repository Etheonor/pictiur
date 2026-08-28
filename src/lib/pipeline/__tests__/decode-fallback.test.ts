import { describe, expect, it } from 'vitest';
import { resolveDecoderId } from '../index';

describe('resolveDecoderId', () => {
	it('maps heic and heif to the heic codec', () => {
		expect(resolveDecoderId('image/heic')).toBe('heic');
		expect(resolveDecoderId('image/heif')).toBe('heic');
	});

	it('proposes no fallback for native formats', () => {
		expect(resolveDecoderId('image/jpeg')).toBeUndefined();
		expect(resolveDecoderId('image/png')).toBeUndefined();
		expect(resolveDecoderId('')).toBeUndefined();
	});
});
