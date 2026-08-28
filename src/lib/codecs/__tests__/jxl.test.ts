import { describe, expect, it } from 'vitest';
import { jxlCodec } from '../jxl';
import { gradientRgba } from '../test/fixtures';
import { installImageDataPolyfill } from '../test/image-data-polyfill';

installImageDataPolyfill();

// Wasm jsquash cannot load in Node (fetch of file:// is not implemented).
// Skipped here; the real proof is the browser smoke test (e2e/codecs-smoke.spec.ts).
const nodeCannotLoadWasm = true;

describe('jxl codec', () => {
	it.skipIf(nodeCannotLoadWasm)('encodes and decodes a JXL image', async () => {
		// Keep the fixture small: libjxl encoding is slow.
		const blob = await jxlCodec.encode!(gradientRgba(16, 16), { quality: 75, effort: 3 });
		expect(blob.type).toBe('image/jxl');
		expect(await blob.arrayBuffer()).not.toHaveLength(0);

		const rgba = await jxlCodec.decode!(await blob.arrayBuffer());
		expect(rgba.width).toBe(16);
		expect(rgba.height).toBe(16);
	});

	it.skipIf(nodeCannotLoadWasm)('supports lossless mode', async () => {
		const blob = await jxlCodec.encode!(gradientRgba(16, 16), {
			quality: 100,
			lossless: true,
			effort: 3
		});
		expect(await blob.arrayBuffer()).not.toHaveLength(0);
	});
});
