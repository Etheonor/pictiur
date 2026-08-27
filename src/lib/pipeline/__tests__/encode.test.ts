import { describe, expect, it, vi } from 'vitest';
import type { Codec } from '../../codecs/types';
import { encodeRgba } from '../encode';
import { hasAlpha } from '../normalize';

const fakeCodec = (alpha: boolean): Codec => ({
	id: 'fake',
	label: 'Fake',
	mime: 'image/jpeg',
	extensions: ['jpg'],
	kind: 'encode',
	supports: { lossy: true, lossless: false, alpha },
	defaultQuality: 80,
	encode: vi.fn(async () => new Blob())
});

const rgbaWithAlpha = () => ({
	width: 2,
	height: 1,
	data: new Uint8ClampedArray([255, 0, 0, 128, 0, 255, 0, 255])
});

describe('encodeRgba', () => {
	it('flattens alpha for codecs without alpha support', async () => {
		const codec = fakeCodec(false);
		await encodeRgba(rgbaWithAlpha(), codec, { quality: 80 });
		const received = (codec.encode as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(hasAlpha(received)).toBe(false);
		expect(received.data[3]).toBe(255);
	});

	it('keeps alpha untouched for codecs with alpha', async () => {
		const codec = fakeCodec(true);
		await encodeRgba(rgbaWithAlpha(), codec, { quality: 80 });
		const received = (codec.encode as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(hasAlpha(received)).toBe(true);
	});

	it('forwards encode options', async () => {
		const codec = fakeCodec(true);
		await encodeRgba(rgbaWithAlpha(), codec, { quality: 42, progressive: true });
		expect((codec.encode as ReturnType<typeof vi.fn>).mock.calls[0][1]).toMatchObject({
			quality: 42,
			progressive: true
		});
	});
});