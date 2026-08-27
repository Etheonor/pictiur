import { describe, expect, it } from 'vitest';
import { arrayBufferToBlob, createImageData, fromImageData } from '../image-data';
import { gradientRgba } from '../test/fixtures';
import { installImageDataPolyfill } from '../test/image-data-polyfill';

installImageDataPolyfill();

describe('ImageData <-> RGBA bridge', () => {
	it('creates an ImageData from RGBA', () => {
		const rgba = gradientRgba(8, 8);
		const img = createImageData(rgba);
		expect(img.width).toBe(8);
		expect(img.height).toBe(8);
		expect(img.data.length).toBe(8 * 8 * 4);
	});

	it('roundtrips RGBA through ImageData', () => {
		const rgba = gradientRgba(4, 4);
		const back = fromImageData(createImageData(rgba));
		expect(back).toEqual(rgba);
	});

	it('turns an ArrayBuffer into a typed Blob', () => {
		const buf = new Uint8Array([1, 2, 3]).buffer;
		const blob = arrayBufferToBlob(buf, 'image/jpeg');
		expect(blob.type).toBe('image/jpeg');
		expect(blob.size).toBe(3);
	});
});