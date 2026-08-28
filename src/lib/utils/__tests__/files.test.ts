import { describe, expect, it } from 'vitest';
import { filesFromList, outputFileName, toPipelineOptions } from '../files';

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

describe('heic / heif (inputs)', () => {
	it('accepts the standard mime', async () => {
		const f = new File([new Uint8Array(4)], 'photo.heic', { type: 'image/heic' });
		const { files, rejected } = await filesFromList([f]);
		expect(rejected).toHaveLength(0);
		expect(files[0].mime).toBe('image/heic');
	});

	it('accepts by extension even with a generic mime (iPhone octet-stream)', async () => {
		const f = new File([new Uint8Array(4)], 'IMG_1234.HEIC', {
			type: 'application/octet-stream'
		});
		const { files, rejected } = await filesFromList([f]);
		expect(rejected).toHaveLength(0);
		expect(files[0].mime).toBe('image/heic');
	});

	it('rejects an octet-stream without an image extension', async () => {
		const f = new File([new Uint8Array(4)], 'archive.bin', { type: 'application/octet-stream' });
		const { files, rejected } = await filesFromList([f]);
		expect(files).toHaveLength(0);
		expect(rejected[0].reason).toBe('unsupported');
	});
});

describe('outputFileName', () => {
	it('maps mime to the right extension', () => {
		expect(outputFileName('photo.png', 'image/webp')).toBe('photo.webp');
		expect(outputFileName('photo.jpeg', 'image/jpeg')).toBe('photo.jpg');
		expect(outputFileName('photo', 'image/avif')).toBe('photo.avif');
	});
});

describe('toPipelineOptions', () => {
	const base = {
		compressMode: 'weight' as const,
		quality: 80,
		maxWidth: 0,
		maxHeight: 0,
		fit: 'contain' as const,
		maxWeightKB: 600
	};

	it('passes budget for lossy formats', () => {
		const o = toPipelineOptions({ ...base, targetFormat: 'webp' });
		expect(o.maxWeightKB).toBe(600);
		expect(o.quality).toBeUndefined();
	});

	it('never applies budget to png (lossless, oxipng ignores quality)', () => {
		const o = toPipelineOptions({ ...base, targetFormat: 'png' });
		expect(o.maxWeightKB).toBeUndefined();
		expect(o.quality).toBe(80);
	});
});
