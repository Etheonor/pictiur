import resize from '@jsquash/resize';
import { createImageData, fromImageData } from '../codecs/image-data';
import type { RGBA } from '../codecs/types';
import { LIMITS } from './job';
import type { FitMode } from './job';

export interface ResizePlan {
	width: number;
	height: number;
	/** cover only: centered crop after resize */
	crop?: { width: number; height: number };
}

const isFiniteNum = (n: number | undefined): n is number =>
	typeof n === 'number' && Number.isFinite(n);

/**
 * Computes the resize plan WITHOUT upscaling: returns null if the image
 * already fits in the box (no resize needed).
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
		// Cover the box (overflow) then center-crop to the target.
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

	// contain (default): the image fits in the box, ratio preserved
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
 * Intermediate steps of the pyramidal resize: divide by 2 until
 * within ≤ 2× of the target, to never degrade sharply
 * (and limit peak memory) on very large images.
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
		method: 'lanczos3' // high-quality kernel (package default, made explicit here)
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
