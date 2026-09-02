import { getCodec } from '../codecs';
import type { Codec, RGBA } from '../codecs/types';
import { encodeRgba } from './encode';
import { LIMITS, resolveOptions, validateOptions } from './job';
import type { PipelineInput, PipelineResult } from './job';
import { buildResizeSteps, centerCrop, planResize, resizeRgba } from './resize';
import { encodeToTarget } from './target-size';
import { applyTransform } from './transform';

export interface PipelineEnv {
	/** Decodes a Blob to RGBA (default: createImageBitmap + OffscreenCanvas, browser/worker). */
	decode?: (blob: Blob) => Promise<RGBA>;
	/** Resizes RGBA (default: @jsquash/resize, lanczos3). Injectable for tests. */
	resize?: (rgba: RGBA, width: number, height: number) => Promise<RGBA>;
	/** Resolves a codec by id (default: real registry). */
	getCodec?: (id: string) => Promise<Codec | undefined>;
	onProgress?: (progress: number) => void;
	/** Cooperative cancellation — checked BETWEEN the HEAVY steps (decode/resize/encode). */
	shouldCancel?: () => boolean;
}

// --- backup decoder resolution (HEIC/HEIF only) ---
export function resolveDecoderId(mime: string): string | undefined {
	return mime === 'image/heic' || mime === 'image/heif' ? 'heic' : undefined;
}

/** Native browser decode: createImageBitmap, otherwise the WASM codec for HEIC/HEIF. */
export async function decodeInBrowser(blob: Blob, fallbackCodecId?: string): Promise<RGBA> {
	try {
		const bitmap = await createImageBitmap(blob);
		try {
			const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Canvas 2D context unavailable');
			ctx.drawImage(bitmap, 0, 0);
			const img = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
			return { width: bitmap.width, height: bitmap.height, data: img.data };
		} finally {
			bitmap.close();
		}
	} catch (error) {
		// Target a real decode failure (e.g. HEIC has no native support): only fall back
		// for heic/heif — a JPEG/PNG failure must surface, not be swallowed.
		if (!fallbackCodecId) {
			throw new Error(error instanceof Error ? error.message : String(error), { cause: error });
		}
		const codec = await getCodec(fallbackCodecId);
		if (!codec?.decode) throw new Error('UNSUPPORTED_FORMAT', { cause: error });
		return codec.decode(await blob.arrayBuffer());
	}
}

export async function runPipeline(
	input: PipelineInput,
	env: PipelineEnv = {}
): Promise<PipelineResult> {
	const decode =
		env.decode ?? ((blob: Blob) => decodeInBrowser(blob, resolveDecoderId(input.mime)));
	const resize = env.resize ?? resizeRgba;
	const resolveCodec = env.getCodec ?? getCodec;
	const onProgress = env.onProgress ?? (() => {});
	const ensureActive = (): void => {
		if (env.shouldCancel?.()) throw new Error('ABORTED');
	};

	const validation = validateOptions(input.options);
	if (!validation.ok) {
		throw new Error(`INVALID_OPTIONS: ${validation.errors.join('; ')}`);
	}
	if (input.file.size > LIMITS.maxFileBytes) {
		throw new Error('MAX_FILE_SIZE');
	}

	onProgress(10); // decode
	const source = await decode(input.file);
	if (source.width > LIMITS.maxDimension || source.height > LIMITS.maxDimension) {
		throw new Error('MAX_DIMENSION');
	}
	if (source.width * source.height > LIMITS.maxPixels) {
		throw new Error('MAX_PIXELS');
	}
	ensureActive();
	const inputSize = input.file.size;

	// transform: per-file rotate/flip on display pixels, BEFORE resize
	const options = resolveOptions(input.options);
	let rgba = applyTransform(source, options.transform);
	ensureActive();

	// resize (plan + pyramidal steps) — geometry computed on the transformed dims
	const plan = planResize(rgba, options.fit, options.maxWidth, options.maxHeight);
	onProgress(30);
	if (plan) {
		onProgress(45);
		for (const step of buildResizeSteps(rgba, plan)) {
			rgba = await resize(rgba, step.width, step.height);
			ensureActive();
			onProgress(50);
		}
		rgba = await resize(rgba, plan.width, plan.height);
		if (plan.crop) {
			rgba = centerCrop(rgba, plan.crop.width, plan.crop.height);
		}
		onProgress(60);
	}

	// encode (plain or budget)
	ensureActive();
	onProgress(65);
	const codec = await resolveCodec(options.targetFormat);
	if (!codec) {
		throw new Error(`UNKNOWN_FORMAT: ${options.targetFormat}`);
	}

	let blob: Blob;
	let qualityUsed: number | undefined;
	if (options.maxWeightKB !== undefined) {
		const budget = await encodeToTarget(rgba, codec, {
			maxWeightKB: options.maxWeightKB,
			quality: options.quality,
			lossless: options.lossless,
			progressive: options.progressive,
			effort: options.effort,
			onRoundStart: ensureActive,
			onProgress
		});
		blob = budget.blob;
		qualityUsed = budget.quality;
	} else {
		blob = await encodeRgba(rgba, codec, {
			quality: options.quality,
			lossless: options.lossless,
			progressive: options.progressive,
			effort: options.effort
		});
	}
	onProgress(95);

	const result: PipelineResult = {
		blob,
		mime: codec.mime,
		width: rgba.width,
		height: rgba.height,
		inputSize,
		outputSize: blob.size,
		qualityUsed
	};
	onProgress(100);
	return result;
}
