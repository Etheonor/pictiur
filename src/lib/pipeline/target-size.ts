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
	tolerance?: number; // dépassement toléré (0.1 = +10 %)
	/** Première qualité sondée (heuristique). Consomme une itération. */
	initialQuality?: number;
	/** Appelé avant chaque probe — sert la cancellation (T4.2). */
	onRoundStart?: () => void;
	/** Progression 70→95 pendant la boucle budget (pour l'UI). */
	onProgress?: (progress: number) => void;
}

/**
 * Heuristique de qualité initiale : plus la cible est agressive (ratio octets
 * source / octets cibles élevé), plus la première qualité est basse.
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
	// heuristique : ~-12 points de qualité par octave d'écart (ratio)
	const ratio = rawBytes / targetBytes;
	const guess = 78 - Math.log2(ratio) * 12;
	return Math.min(hi, Math.max(lo, Math.round(guess)));
}

/**
 * Bissection sur la qualité : renvoie la plus haute qualité dont le poids
 * tient dans `targetBytes` (tolérance incluse), ou la qualité minimale
 * si même elle déborde. Total ≤ `maxIterations` probes.
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

	// 1) estimation initiale (optionnelle)
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

	// 2) bissection — on réserve 1 probe pour le fallback minQ (≤ maxIt au total)
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
