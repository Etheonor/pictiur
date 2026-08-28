import { getCodec } from '../codecs';
import type { Codec, RGBA } from '../codecs/types';
import { codecIdFromMime } from '../codecs';
import { encodeRgba } from './encode';
import { LIMITS, resolveOptions, validateOptions } from './job';
import type { PipelineInput, PipelineResult } from './job';
import { buildResizeSteps, centerCrop, planResize, resizeRgba } from './resize';
import { encodeToTarget } from './target-size';

export interface PipelineEnv {
	/** Décode un Blob en RGBA (défaut : createImageBitmap + OffscreenCanvas, navigateur/worker). */
	decode?: (blob: Blob) => Promise<RGBA>;
	/** Resize RGBA (défaut : @jsquash/resize, lanczos3). Injectable pour les tests. */
	resize?: (rgba: RGBA, width: number, height: number) => Promise<RGBA>;
	/** Résout un codec par id (défaut : registre réel). */
	getCodec?: (id: string) => Promise<Codec | undefined>;
	onProgress?: (progress: number) => void;
	/** Annulation coopérative — vérifiée ENTRE les étapes LOURDES (decode/resize/encode). */
	shouldCancel?: () => boolean;
}

/** Décode natif navigateur/worker : applique l'orientation EXIF (from-image). */
export async function decodeInBrowser(
	blob: Blob,
	resolveCodec: (id: string) => Promise<Codec | undefined> = getCodec
): Promise<RGBA> {
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
	} catch {
		// Fallback WASM (PLAN §3.4) : createImageBitmap échoue pour certains formats
		// (ex. AVIF sur vieux navigateurs, JXL hors Safari). On tente le décodeur natif.
		const id = codecIdFromMime(blob.type);
		const codec = id ? await resolveCodec(id) : undefined;
		if (codec?.decode) return codec.decode(await blob.arrayBuffer());
		throw new Error('DECODE_FAILED');
	}
}

export async function runPipeline(
	input: PipelineInput,
	env: PipelineEnv = {}
): Promise<PipelineResult> {
	const decode = env.decode ?? decodeInBrowser;
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

	// resize (plan + pyramidal)
	const options = resolveOptions(input.options);
	const plan = planResize(source, options.fit, options.maxWidth, options.maxHeight);
	onProgress(30);
	let rgba = source;
	if (plan) {
		onProgress(45);
		for (const step of buildResizeSteps(source, plan)) {
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

	// encode (simple ou budget)
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
