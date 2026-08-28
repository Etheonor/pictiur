import type { Codec, RGBA } from '../codecs/types';
import { encodeRgba } from './encode';
import { LIMITS } from './job';

export interface ProbeResult {
	quality: number;
	blob: Blob;
	size: number;
}

export type ProbeFn = (quality: number) => Promise<ProbeResult>;

export type BudgetResult = ProbeResult;

export interface BudgetParams {
	minQuality?: number;
	maxQuality?: number;
	maxIterations?: number;
	tolerance?: number; // allowed overshoot (0.1 = +10 %)
	/** First probed quality (heuristic). Costs one iteration. */
	initialQuality?: number;
	/** Called before each probe — used for cancellation (T4.2). */
	onRoundStart?: () => void;
	/** Progress 70→95 during the budget loop (for the UI). */
	onProgress?: (progress: number) => void;
}

/**
 * Initial quality heuristic: the more aggressive the target (high source
 * bytes / target bytes ratio), the lower the initial quality.
 */
export function initialQualityGuess(
	rawBytes: number,
	targetBytes: number,
	min?: number,
	max?: number
): number {
	const lo = min ?? LIMITS.qualityMin;
	const hi = max ?? LIMITS.qualityMax;
	if (!Number.isFinite(rawBytes) || rawBytes <= 0 || targetBytes <= 0) return lo;
	// heuristic: ~-12 quality points per octave of ratio gap
	const ratio = rawBytes / targetBytes;
	const guess = 78 - Math.log2(ratio) * 12;
	return Math.min(hi, Math.max(lo, Math.round(guess)));
}

/**
 * Quality bisection: returns the highest quality whose weight
 * fits within `targetBytes` (tolerance included), or the minimum quality
 * if even that overflows. Total ≤ `maxIterations` probes.
 */
export async function encodeWithinBudget(
	probe: ProbeFn,
	targetBytes: number,
	params: BudgetParams = {}
): Promise<BudgetResult> {
	const minQ = params.minQuality ?? LIMITS.qualityMin;
	const maxQ = params.maxQuality ?? LIMITS.qualityMax;
	const maxIt = params.maxIterations ?? LIMITS.targetIterations;
	const tolerance = params.tolerance ?? LIMITS.targetTolerance;
	const limit = targetBytes * (1 + tolerance);

	let best: BudgetResult | null = null;
	let lo = minQ;
	let hi = maxQ;
	let probes = 0;

	const probeOnce = async (q: number): Promise<ProbeResult> => {
		params.onRoundStart?.();
		probes++;
		params.onProgress?.(Math.min(94, Math.round(70 + (probes / maxIt) * 24)));
		return probe(q);
	};

	// 1) initial estimate (optional)
	if (params.initialQuality !== undefined) {
		const q = Math.min(maxQ, Math.max(minQ, Math.round(params.initialQuality)));
		const result = await probeOnce(q);
		if (result.size <= limit) {
			best = result;
			lo = q + 1;
		} else {
			hi = q - 1;
		}
	}

	// 2) bisection — keep 1 probe for the minQ fallback (≤ maxIt in total)
	while (probes < maxIt - 1 && lo <= hi) {
		const q = Math.round((lo + hi) / 2);
		const result = await probeOnce(q);
		if (result.size <= limit) {
			best = result;
			lo = q + 1;
		} else {
			hi = q - 1;
		}
	}

	return best ?? probe(minQ);
}

export async function encodeToTarget(
	rgba: RGBA,
	codec: Codec,
	options: {
		maxWeightKB: number;
		quality?: number;
		lossless?: boolean;
		progressive?: boolean;
		effort?: number;
		onRoundStart?: () => void;
		onProgress?: (progress: number) => void;
	}
): Promise<BudgetResult> {
	const targetBytes = options.maxWeightKB * 1024;
	const probe: ProbeFn = async (quality) => {
		const blob = await encodeRgba(rgba, codec, {
			quality,
			lossless: options.lossless,
			progressive: options.progressive,
			effort: options.effort
		});
		return { quality, blob, size: blob.size };
	};
	return encodeWithinBudget(probe, targetBytes, {
		initialQuality: initialQualityGuess(rgba.width * rgba.height * 4, targetBytes),
		onRoundStart: options.onRoundStart,
		onProgress: options.onProgress
	});
}
