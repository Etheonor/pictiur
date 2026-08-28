import { describe, expect, it } from 'vitest';
import { pngCodec } from '../png';
import { gradientRgba, hex } from '../test/fixtures';
import { installImageDataPolyfill } from '../test/image-data-polyfill';

installImageDataPolyfill();

// Wasm jsquash cannot load in Node (fetch of file:// is not implemented).
// Skipped here; the real proof is the browser smoke test (e2e/codecs-smoke.spec.ts).
const nodeCannotLoadWasm = true;

describe('png codec (oxipng)', () => {
	it.skipIf(nodeCannotLoadWasm)('encodes a valid PNG', async () => {
		const blob = await pngCodec.encode!(gradientRgba(24, 24), { quality: 100 });
		const buf = await blob.arrayBuffer();
		expect(hex(buf).startsWith('89 50 4e 47')).toBe(true); // PNG magic bytes
		expect(blob.type).toBe('image/png');
	});

	it.skipIf(nodeCannotLoadWasm)('optimize shrinks an unoptimized PNG', async () => {
		const raw = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 1])]);
		const out = await pngCodec.optimize!(raw, 4);
		expect((await out.arrayBuffer()).byteLength).toBeGreaterThan(0);
	});

	it.skipIf(nodeCannotLoadWasm)('roundtrips with same dimensions', async () => {
		const blob = await pngCodec.encode!(gradientRgba(16, 16), { quality: 100, effort: 4 });
		const rgba = await pngCodec.decode!(await blob.arrayBuffer());
		expect(rgba.width).toBe(16);
		expect(rgba.height).toBe(16);
	});
});
