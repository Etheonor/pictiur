import { describe, expect, it } from 'vitest';
import { avifCodec } from '../avif';
import { gradientRgba, hex } from '../test/fixtures';
import { installImageDataPolyfill } from '../test/image-data-polyfill';

installImageDataPolyfill();

// Wasm jsquash cannot load in Node (fetch of file:// is not implemented).
// Skipped here; the real proof is the browser smoke test (e2e/codecs-smoke.spec.ts).
const nodeCannotLoadWasm = true;

describe('avif codec', () => {
	it.skipIf(nodeCannotLoadWasm)('encodes a valid AVIF (ftyp container)', async () => {
		const blob = await avifCodec.encode(gradientRgba(24, 24), { quality: 60 });
		const buf = await blob.arrayBuffer();
		expect(hex(buf)).toContain('66747970'); // "ftyp" at byte 4
		expect(blob.type).toBe('image/avif');
	});

	it.skipIf(nodeCannotLoadWasm)('lower quality yields a smaller file', async () => {
		const low = await avifCodec.encode(gradientRgba(64, 64), { quality: 20 });
		const high = await avifCodec.encode(gradientRgba(64, 64), { quality: 95 });
		expect(low.size).toBeLessThan(high.size);
	});

	it.skipIf(nodeCannotLoadWasm)('roundtrips with same dimensions', async () => {
		const blob = await avifCodec.encode(gradientRgba(16, 16), { quality: 60, effort: 2 });
		const rgba = await avifCodec.decode!(await blob.arrayBuffer());
		expect(rgba.width).toBe(16);
		expect(rgba.height).toBe(16);
	});
});
