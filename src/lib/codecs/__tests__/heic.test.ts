import { describe, expect, it } from 'vitest';
import { codecIdFromMime, getCodec, registerCodec } from '../registry';
import { heicCodec } from '../heic';

describe('codec heic (contract)', () => {
	it('is a decode-only codec with the right metadata', () => {
		expect(heicCodec.id).toBe('heic');
		expect(heicCodec.kind).toBe('decode');
		expect(heicCodec.extensions).toEqual(['heic', 'heif']);
		expect(heicCodec.decode).toBeTypeOf('function');
		expect(heicCodec.encode).toBeUndefined();
	});

	it('resolves lazily through the registry and is indexed by mime', async () => {
		registerCodec('heic', async () => heicCodec);
		expect((await getCodec('heic'))?.id).toBe('heic');
		expect(codecIdFromMime('image/heic')).toBe('heic');
		expect(codecIdFromMime('image/heif')).toBe('heic');
		expect(codecIdFromMime('image/png')).not.toBe('heic');
	});
});
