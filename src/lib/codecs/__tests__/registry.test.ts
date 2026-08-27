import { describe, expect, it, vi } from 'vitest';
import { getCodec, listCodecs, registerCodec, registerStaticCodec } from '../registry';
import type { Codec } from '../types';

const dummy = (id: string): Codec => ({
	id,
	label: id,
	mime: `image/${id}`,
	extensions: [id],
	kind: 'encode',
	supports: { lossy: true, lossless: false, alpha: false },
	defaultQuality: 80,
	encode: async () => new Blob()
});

describe('codec registry', () => {
	it('resolves a static codec', async () => {
		registerStaticCodec(dummy('dummy'));
		expect((await getCodec('dummy'))?.id).toBe('dummy');
	});

	it('lazy codecs load only on first access, then cache', async () => {
		const loader = vi.fn(async () => dummy('lazy1'));
		registerCodec('lazy1', loader);
		expect(loader).not.toHaveBeenCalled();
		expect((await getCodec('lazy1'))?.id).toBe('lazy1');
		expect(loader).toHaveBeenCalledTimes(1);
		await getCodec('lazy1');
		expect(loader).toHaveBeenCalledTimes(1); // cached
	});

	it('returns undefined for unknown ids', async () => {
		expect(await getCodec('nope')).toBeUndefined();
	});

	it('lists every registered codec', async () => {
		registerCodec('lazy2', async () => dummy('lazy2'));
		const ids = (await listCodecs()).map((c) => c.id);
		expect(ids).toContain('lazy2');
	});
});