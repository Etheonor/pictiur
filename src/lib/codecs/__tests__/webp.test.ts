import { describe, expect, it } from 'vitest';
import { webpCodec } from '../webp';
import { gradientRgba, hex } from '../test/fixtures';
import { installImageDataPolyfill } from '../test/image-data-polyfill';

installImageDataPolyfill();

// Wasm jsquash cannot load in Node (fetch of file:// is not implemented).
// Skipped here; the real proof is the browser smoke test (e2e/codecs-smoke.spec.ts).
const nodeCannotLoadWasm = true;

describe('webp codec', () => {
	it.skipIf(nodeCannotLoadWasm)('encodes a valid WebP (RIFF container)', async () => {
		const blob = await webpCodec.encode(gradientRgba(24, 24), { quality: 80 });
		const buf = await blob.arrayBuffer();
		expect(hex(buf).startsWith('52 49 46 46')).toBe(true); // "RIFF"
		expect(blob.type).toBe('image/webp');
	});

	it.skipIf(nodeCannotLoadWasm)('roundtrips with same dimensions', async () => {
		const blob = await webpCodec.encode(gradientRgba(14, 10), { quality: 80 });
		const rgba = await webpCodec.decode!(await blob.arrayBuffer());
		expect(rgba.width).toBe(14);
		expect(rgba.height).toBe(10);
	});
});