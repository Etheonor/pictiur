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

// Formats lisibles par createImageBitmap (v1, PLAN §2 « Couverture des formats »)
export const INPUT_MIMES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/svg+xml',
	'image/bmp',
	'image/avif'
]);

export async function filesFromList(
	list: FileList | File[]
): Promise<{ files: InputFile[]; rejected: RejectedFile[] }> {
	const files: InputFile[] = [];
	const rejected: RejectedFile[] = [];
	for (const file of Array.from(list)) {
		if (!INPUT_MIMES.has(file.type)) {
			rejected.push({ name: file.name, reason: 'unsupported' });
			continue;
		}
		if (file.size > LIMITS.maxFileBytes) {
			rejected.push({ name: file.name, reason: 'tooLarge' });
			continue;
		}
		files.push({
			name: file.name,
			mime: file.type,
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

export function toPipelineOptions(settings: {
	targetFormat: string;
	compressMode: 'quality' | 'weight';
	quality: number;
	maxWidth: number;
	maxHeight: number;
	fit: 'contain' | 'cover' | 'fill';
	maxWeightKB: number;
}): PipelineOptions {
	// Le budget (poids max) est sans effet sur PNG : oxipng ignore la qualité.
	// PNG passe donc toujours en qualité fixe (garde-fou).
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
