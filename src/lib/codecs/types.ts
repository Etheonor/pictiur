export interface RGBA {
	width: number;
	height: number;
	data: Uint8ClampedArray; // RGBA non-premultiplied
}

export type CodecKind = 'decode' | 'encode' | 'both';

export interface CodecCapabilities {
	lossy: boolean;
	lossless: boolean;
	alpha: boolean;
	progressive?: boolean;
	animated?: boolean;
}

export interface EncodeOptions {
	quality: number; // 0-100
	lossless?: boolean;
	progressive?: boolean;
	effort?: number; // speed/quality trade-off (avif, jxl, png level)
}

export interface Codec {
	id: string;
	label: string;
	mime: string;
	extensions: string[];
	kind: CodecKind;
	supports: CodecCapabilities;
	defaultQuality: number;
	encode(rgba: RGBA, opts: EncodeOptions): Promise<Blob>;
	decode?(data: ArrayBuffer): Promise<RGBA>;
	optimize?(blob: Blob, level: number): Promise<Blob>;
}
