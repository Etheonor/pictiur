import { describe, expect, it, vi } from 'vitest';
import { encodeWithinBudget, initialQualityGuess } from '../target-size';

describe('initialQualityGuess', () => {
	it('clamps to the quality bounds', () => {
		expect(initialQualityGuess(10_000_000, 1_000_000)).toBeGreaterThanOrEqual(20);
		expect(initialQualityGuess(10_000_000, 1_000_000)).toBeLessThanOrEqual(95);
	});

	it('lowers the guess when the target is aggressive', () => {
		// ratio 100× → beaucoup plus bas que ratio 2×
		const aggressive = initialQualityGuess(100_000_000, 1_000_000);
		const gentle = initialQualityGuess(2_000_000, 1_000_000);
		expect(aggressive).toBeLessThan(gentle);
	});

	it('returns the floor for absurd targets', () => {
		expect(initialQualityGuess(10_000_000, 1)).toBe(20);
	});
});

describe('encodeWithinBudget avec quality initiale', () => {
	// probe déterministe : taille = f(quality)
	const probe = (quality: number) => {
		const size = Math.max(50, Math.round(1_000_000 / quality));
		return Promise.resolve({ quality, blob: new Blob([new Uint8Array(size)]), size });
	};

	it('probes the initial guess FIRST, then converges within maxIterations', async () => {
		const calls: number[] = [];
		const spy = vi.fn(async (q: number) => {
			calls.push(q);
			return probe(q);
		});

		const initial = 40;
		const res = await encodeWithinBudget(spy, 50_000, { initialQuality: initial });
		expect(calls[0]).toBe(initial); // l'estimation est la première probe
		expect(calls.length).toBeLessThanOrEqual(6); // budget de probes respecté
		expect(res.size).toBeLessThanOrEqual(50_000 * 1.1);
	});

	it('still works without an initial guess (backward compatible)', async () => {
		const calls: number[] = [];
		const res = await encodeWithinBudget(async (q) => {
			calls.push(q);
			return probe(q);
		}, 50_000);
		expect(res.size).toBeLessThanOrEqual(50_000 * 1.1);
		expect(calls[0]).toBe(Math.round((20 + 95) / 2)); // bissection classique
	});
});
