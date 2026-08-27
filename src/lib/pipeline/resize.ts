import resize from '@jsquash/resize';
import { createImageData, fromImageData } from '../codecs/image-data';
import type { RGBA } from '../codecs/types';
import { LIMITS } from './job';
import type { FitMode } from './job';

export interface ResizePlan {
	width: number;
	height: number;
	/** cover uniquement : recadrage centré après resize */
	crop?: { width: number; height: number };
}

const isFiniteNum = (n: number | undefined): n is number =>
	typeof n === 'number' && Number.isFinite(n);

/**
 * Calcule le plan de resize SANS upscale : renvoie null si l'image
 * tient déjà dans la boîte (aucun redimensionnement nécessaire).
 */
export function planResize(
	input: { width: number; height: number },
	fit: FitMode,
	maxWidth?: number,
	maxHeight?: number
): ResizePlan | null {
	const mw = isFiniteNum(maxWidth) ? maxWidth : Infinity;
	const mh = isFiniteNum(maxHeight) ? maxHeight : Infinity;
	if (input.width <= mw && input.height <= mh) return null;
	const ratio = input.width / input.height;

	if (fit === 'fill') {
		return {
			width: isFiniteNum(maxWidth) ? Math.round(maxWidth) : input.width,
			height: isFiniteNum(maxHeight) ? Math.round(maxHeight) : input.height
		};
	}

	if (fit === 'cover' && isFiniteNum(maxWidth) && isFiniteNum(maxHeight)) {
		// Couvre la boîte (débordement) puis crop centré au target.
		const targetRatio = maxWidth / maxHeight;
		let width = input.width;
		let height = input.height;
		if (ratio > targetRatio) {
			height = Math.min(height, maxHeight);
			width = Math.max(maxWidth, Math.round(height * ratio));
		} else {
			width = Math.min(width, maxWidth);
			height = Math.max(maxHeight, Math.round(width / ratio));
		}
		return {
			width,
			height,
			crop: { width: Math.round(maxWidth), height: Math.round(maxHeight) }
		};
	}

	// contain (défaut) : l'image s'inscrit dans la boîte, ratio conservé
	let width = input.width;
	let height = input.height;
	if (width > mw) {
		width = mw;
		height = Math.max(1, Math.round(width / ratio));
	}
	if (height > mh) {
		height = mh;
		width = Math.max(1, Math.round(height * ratio));
	}
	return { width, height };
}

/**
 * Étapes intermédiaires du resize pyramidal : on divise par 2 jusqu'à
 * être à ≤ 2× de la cible, pour ne jamais détériorer brutalement
 * (et limiter la mémoire pic) sur les très grandes images.
 */
export function buildResizeSteps(
	from: { width: number; height: number },
	to: { width: number; height: number }
): { width: number; height: number }[] {
	if (from.width <= to.width && from.height <= to.height) return [];
	if (Math.max(from.width, from.height) <= LIMITS.stepDownThreshold) return [];
	const steps: { width: number; height: number }[] = [];
	let cur = { width: from.width, height: from.height };
	const factor = 2;
	while (cur.width > to.width * factor || cur.height > to.height * factor) {
		cur = {
			width: Math.max(to.width, Math.round(cur.width / factor)),
			height: Math.max(to.height, Math.round(cur.height / factor))
		};
		steps.push(cur);
	}
	return steps;
}

export async function resizeRgba(rgba: RGBA, width: number, height: number): Promise<RGBA> {
	const out = await resize(createImageData(rgba), {
		width,
		height,
		method: 'lanczos3' // kernel haute qualité (défaut du package, explicite ici)
	});
	return fromImageData(out);
}

export function centerCrop(rgba: RGBA, width: number, height: number): RGBA {
	const x = Math.floor((rgba.width - width) / 2);
	const y = Math.floor((rgba.height - height) / 2);
	const out = new Uint8ClampedArray(width * height * 4);
	for (let j = 0; j < height; j++) {
		const srcStart = (y + j) * rgba.width * 4 + x * 4;
		out.set(rgba.data.subarray(srcStart, srcStart + width * 4), j * width * 4);
	}
	return { width, height, data: out };
}
