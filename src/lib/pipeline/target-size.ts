import type { Codec, RGBA } from '../codecs/types';
import { encodeRgba } from './encode';
import { LIMITS } from './job';

export interface ProbeResult {
	quality: number;
	blob: Blob;
	size: number;
}

export type ProbeFn = (quality: number) => Promise<ProbeResult>;

export interface BudgetResult extends ProbeResult {}

export interface BudgetParams {
	minQuality?: number;
	maxQuality?: number;
	maxIterations?: number;
	tolerance?: number; // dépassement toléré (0.1 = +10 %)
}

/**
 * Bissection sur la qualité : renvoie la plus haute qualité dont le poids
 * tient dans `targetBytes` (tolérance incluse), ou la qualité minimale
 * si même elle déborde.
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

	// Sonder le plancher (minQ) une fois : c'est la réponse si rien ne tient.
	const floor = await probe(minQ);
	let best: BudgetResult | null = null;
	let lo = minQ + 1;
	let hi = maxQ;

	// Bissection au-dessus du plancher (on réserve 1 appel pour minQ → ≤ maxIt au total).
	for (let i = 1; i < maxIt && lo <= hi; i++) {
		const q = Math.round((lo + hi) / 2);
		const result = await probe(q);
		if (result.size <= limit) {
			best = result;
			lo = q + 1; // on peut viser plus haut
		} else {
			hi = q - 1;
		}
	}

	return best ?? floor;
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
	return encodeWithinBudget(probe, targetBytes);
}