import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { buildZip } from '../zip';

describe('buildZip', () => {
	it('produces a valid zip with all entries', async () => {
		const blob = await buildZip([
			{ name: 'a.webp', blob: new Blob([new Uint8Array([1, 2, 3])]) },
			{ name: 'b.png', blob: new Blob([new Uint8Array([4, 5])]) }
		]);
		const bytes = new Uint8Array(await blob.arrayBuffer());
		const unzipped = unzipSync(bytes);
		expect(Object.keys(unzipped)).toEqual(['a.webp', 'b.png']);
	});

	it('dedupes equal names and strips unsafe separators', async () => {
		const blob = await buildZip([
			{ name: '../evil.png', blob: new Blob([new Uint8Array(1)]) },
			{ name: 'evil.png', blob: new Blob([new Uint8Array(1)]) }
		]);
		const unzipped = unzipSync(new Uint8Array(await blob.arrayBuffer()));
		const keys = Object.keys(unzipped);
		expect(keys).toHaveLength(2);
		expect(keys.some((k) => k.includes('/') || k.includes('\\'))).toBe(false);
		expect(new Set(keys).size).toBe(2);
	});
});
