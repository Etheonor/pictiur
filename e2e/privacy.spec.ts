import { expect, test } from '@playwright/test';

// Privacy proof backing the FAQ: re-encoding strips every metadata block.
// We build a JPEG that literally carries an "Exif\0\0" APP1 segment, push it through
// the real pipeline, and assert the OUTPUT buffer contains no "Exif" signature.
test('re-encoded output contains no EXIF metadata', async ({ page }) => {
	await page.goto('/');

	const info = await page.evaluate(async () => {
		const EXIF = [0x45, 0x78, 0x69, 0x66]; // "Exif"
		const contains = (bytes: Uint8Array, sig: number[]): boolean => {
			for (let i = 0; i + sig.length <= bytes.length; i++) {
				if (sig.every((b, k) => bytes[i + k] === b)) return true;
			}
			return false;
		};

		// real JPEG, then splice an EXIF APP1 right after SOI.
		const canvas = new OffscreenCanvas(8, 6);
		const ctx = canvas.getContext('2d')!;
		ctx.fillStyle = '#4a7';
		ctx.fillRect(0, 0, 8, 6);
		const jpeg = new Uint8Array(
			await (await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 })).arrayBuffer()
		);
		const tiff = new Uint8Array([
			0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x12, 0x01, 0x03, 0x00, 0x01,
			0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		]);
		const exifHeader = new TextEncoder().encode('Exif\0\0');
		const app1Len = exifHeader.length + tiff.length + 2;
		const app1 = new Uint8Array(2 + 2 + exifHeader.length + tiff.length);
		app1.set([0xff, 0xe1, (app1Len >> 8) & 0xff, app1Len & 0xff], 0);
		app1.set(exifHeader, 4);
		app1.set(tiff, 4 + exifHeader.length);
		const withExif = new Uint8Array(jpeg.length + app1.length);
		withExif.set(jpeg.slice(0, 2), 0);
		withExif.set(app1, 2);
		withExif.set(jpeg.slice(2), 2 + app1.length);

		const { createBrowserPool } = await import('/src/lib/workers/index.ts');
		const pool = createBrowserPool(1);
		const buffer = withExif.slice().buffer;
		const res = await pool.submit({
			payload: {
				id: 'exif-strip',
				name: 'in.jpg',
				mime: 'image/jpeg',
				buffer,
				options: { targetFormat: 'jpeg', quality: 80 }
			},
			transfer: [buffer]
		});
		pool.terminate();

		return {
			inputHasExif: contains(withExif, EXIF),
			outputHasExif: contains(new Uint8Array(res.buffer), EXIF)
		};
	});

	expect(info.inputHasExif).toBe(true); // sanity: the source really carried EXIF
	expect(info.outputHasExif).toBe(false); // proof: re-encode stripped it
});
