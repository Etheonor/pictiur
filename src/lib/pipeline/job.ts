import type { EncodeOptions } from '../codecs/types';
import type { ImageTransform } from './transform';
import { IDENTITY_TRANSFORM } from './transform';

export type FitMode = 'contain' | 'cover' | 'fill';

export interface PipelineOptions extends Partial<EncodeOptions> {
	targetFormat: string; // codec id: 'jpeg' | 'webp' | 'png' | 'avif' | 'jxl'
	fit?: FitMode; // default 'contain'
	maxWidth?: number; // px
	maxHeight?: number; // px
	maxWeightKB?: number; // target-size mode: quality bisection
	transform?: ImageTransform; // per-file rotate/flip (default identity)
}

export interface PipelineInput {
	file: Blob;
	mime: string;
	options: PipelineOptions;
}

export interface PipelineResult {
	blob: Blob;
	mime: string;
	width: number;
	height: number;
	inputSize: number; // bytes
	outputSize: number; // bytes
	qualityUsed?: number; // set in target-size mode
}

export const LIMITS = {
	maxDimension: 24_000,
	maxPixels: 150_000_000, // 150 MP → ~600 MB RGBA (peak memory cap)
	maxFileBytes: 100 * 1024 * 1024,
	stepDownThreshold: 8_000,
	qualityMin: 20,
	qualityMax: 95,
	targetIterations: 6,
	targetTolerance: 0.1 // +10 % allowed overshoot
} as const;

export interface ValidationResult {
	ok: boolean;
	errors: string[];
}

export function validateOptions(options: PipelineOptions): ValidationResult {
	const errors: string[] = [];
	if (!options.targetFormat || typeof options.targetFormat !== 'string') {
		errors.push('targetFormat is required');
	}
	if (options.quality !== undefined && (options.quality < 0 || options.quality > 100)) {
		errors.push('quality must be in [0, 100]');
	}
	if (options.maxWidth !== undefined && options.maxWidth < 1) errors.push('maxWidth must be >= 1');
	if (options.maxHeight !== undefined && options.maxHeight < 1)
		errors.push('maxHeight must be >= 1');
	if (options.maxWeightKB !== undefined && options.maxWeightKB < 1)
		errors.push('maxWeightKB must be >= 1');
	if (options.effort !== undefined && (options.effort < 0 || options.effort > 10))
		errors.push('effort must be in [0, 10]');
	const rotate = options.transform?.rotate;
	if (rotate !== undefined && rotate !== 0 && rotate !== 90 && rotate !== 180 && rotate !== 270)
		errors.push('transform.rotate must be 0 | 90 | 180 | 270');
	if (options.transform?.flipH !== undefined && typeof options.transform.flipH !== 'boolean')
		errors.push('transform.flipH must be boolean');
	if (options.transform?.flipV !== undefined && typeof options.transform.flipV !== 'boolean')
		errors.push('transform.flipV must be boolean');
	return { ok: errors.length === 0, errors };
}

export interface ResolvedOptions extends PipelineOptions {
	fit: FitMode;
	quality: number;
	transform: ImageTransform;
}

export function resolveOptions(options: PipelineOptions): ResolvedOptions {
	return {
		...options,
		fit: options.fit ?? 'contain',
		quality: options.quality ?? 80,
		transform: options.transform ?? IDENTITY_TRANSFORM
	};
}
