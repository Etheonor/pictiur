import { describe, expect, it } from 'vitest';
import { filesFromList, outputFileName } from '../files';

describe('filesFromList', () => {
	it('accepts supported images and reports the rest', async () => {
		const good = new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' });
		const bad = new File([new Uint8Array([1])], 'b.mp4', { type: 'video/mp4' });
		const { files, rejected } = await filesFromList([good, bad]);
		expect(files).toHaveLength(1);
		expect(files[0].name).toBe('a.png');
		expect(rejected).toHaveLength(1);
		expect(rejected[0].reason).toBe('unsupported');
	});

	it('rejects oversized files with reason tooLarge', async () => {
		const big = new File([new Uint8Array(101 * 1024 * 1024)], 'big.png', { type: 'image/png' });
		const { files, rejected } = await filesFromList([big]);
		expect(files).toHaveLength(0);
		expect(rejected[0].reason).toBe('tooLarge');
	});
});

describe('outputFileName', () => {
	it('maps mime to the right extension', () => {
		expect(outputFileName('photo.png', 'image/webp')).toBe('photo.webp');
		expect(outputFileName('photo.jpeg', 'image/jpeg')).toBe('photo.jpg');
		expect(outputFileName('photo', 'image/avif')).toBe('photo.avif');
	});
});
