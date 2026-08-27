import { describe, expect, it } from 'vitest';
import { jpegCodec } from '../jpeg';
import { gradientRgba, hex } from '../test/fixtures';
import { installImageDataPolyfill } from '../test/image-data-polyfill';

installImageDataPolyfill();

// Wasm jsquash cannot load in Node (fetch of file:// is not implemented).
// Skipped here; the real proof is the browser smoke test (e2e/codecs-smoke.spec.ts).
const nodeCannotLoadWasm = true;

describe('jpeg codec (mozjpeg)', () => {
	it.skipIf(nodeCannotLoadWasm)('encodes a valid JPEG', async () => {
		const blob = await jpegCodec.encode(gradientRgba(32, 32), { quality: 80 });
		const buf = await blob.arrayBuffer();
		expect(hex(buf).startsWith('ff d8')).toBe(true); // JPEG magic bytes
		expect(blob.type).toBe('image/jpeg');
	});

	it.skipIf(nodeCannotLoadWasm)('roundtrips with same dimensions', async () => {
		const blob = await jpegCodec.encode(gradientRgba(16, 12), { quality: 90 });
		const rgba = await jpegCodec.decode!(await blob.arrayBuffer());
		expect(rgba.width).toBe(16);
		expect(rgba.height).toBe(12);
	});
});
