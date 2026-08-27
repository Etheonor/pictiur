import type { RGBA } from '../types';

export function gradientRgba(width = 64, height = 64): RGBA {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			data[i] = Math.round((x / width) * 255); // red gradient
			data[i + 1] = Math.round((y / height) * 255); // green gradient
			data[i + 2] = 128; // constant blue
			data[i + 3] = x % 2 === 0 ? 255 : 0; // alpha checkerboard
		}
	}
	return { width, height, data };
}

/** First N bytes as hex (little helper for magic-byte assertions). */
export function hex(buffer: ArrayBuffer, count = 12): string {
	return Array.from(new Uint8Array(buffer, 0, count))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join(' ');
}