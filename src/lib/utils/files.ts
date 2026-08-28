import { LIMITS } from '../pipeline/job';
import type { PipelineOptions } from '../pipeline/job';

export interface InputFile {
	name: string;
	mime: string;
	size: number;
	buffer: ArrayBuffer;
}

export interface RejectedFile {
	name: string;
	reason: 'unsupported' | 'tooLarge';
}

// Formats readable by createImageBitmap or the WASM decode fallback (HEIC/HEIF).
export const INPUT_MIMES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/svg+xml',
	'image/bmp',
	'image/avif',
	'image/heic',
	'image/heif'
]);

const HEIC_EXT = /\.heic$/i;

function normalizeInputType(file: File): string {
	// iPhones sometimes share HEIC photos as application/octet-stream: fall back to the extension.
	if (file.type === 'application/octet-stream' && HEIC_EXT.test(file.name)) {
		return 'image/heic';
	}
	return file.type;
}

export async function filesFromList(
	list: FileList | File[]
): Promise<{ files: InputFile[]; rejected: RejectedFile[] }> {
	const files: InputFile[] = [];
	const rejected: RejectedFile[] = [];
	for (const file of Array.from(list)) {
		const mime = normalizeInputType(file);
		if (!INPUT_MIMES.has(mime)) {
			rejected.push({ name: file.name, reason: 'unsupported' });
			continue;
		}
		if (file.size > LIMITS.maxFileBytes) {
			rejected.push({ name: file.name, reason: 'tooLarge' });
			continue;
		}
		files.push({
			name: file.name,
			mime,
			size: file.size,
			buffer: await file.arrayBuffer()
		});
	}
	return { files, rejected };
}

const EXT_BY_MIME: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/avif': 'avif',
	'image/jxl': 'jxl'
};

export function outputFileName(name: string, mime: string): string {
	const base = name.replace(/\.[^./\\]+$/, '') || 'image';
	return `${base}.${EXT_BY_MIME[mime] ?? 'bin'}`;
}

export function formatBytes(bytes: number, lang: 'fr' | 'en'): string {
	const sep = lang === 'fr' ? ',' : '.';
	const n = (v: number): string => v.toFixed(1).replace('.', sep);
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${n(bytes / 1024)} Ko`;
	return `${n(bytes / (1024 * 1024))} Mo`;
}

export function toPipelineOptions(settings: {
	targetFormat: string;
	compressMode: 'quality' | 'weight';
	quality: number;
	maxWidth: number;
	maxHeight: number;
	fit: 'contain' | 'cover' | 'fill';
	maxWeightKB: number;
}): PipelineOptions {
	// The budget (max weight) has no effect on PNG: oxipng ignores quality.
	// PNG therefore always runs at a fixed quality (safety net).
	const weight = settings.compressMode === 'weight' && settings.targetFormat !== 'png';
	return {
		targetFormat: settings.targetFormat,
		quality: weight ? undefined : settings.quality,
		maxWeightKB: weight ? settings.maxWeightKB : undefined,
		maxWidth: settings.maxWidth || undefined,
		maxHeight: settings.maxHeight || undefined,
		fit: settings.fit
	};
}
