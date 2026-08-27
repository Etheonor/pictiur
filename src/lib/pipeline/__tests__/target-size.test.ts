import { describe, expect, it, vi } from 'vitest';
import { encodeWithinBudget } from '../target-size';
import type { ProbeFn } from '../target-size';

describe('encodeWithinBudget', () => {
	// probe déterministe : plus la qualité est haute, plus le fichier est gros
	const makeProbe = (): { probe: ProbeFn; calls: number[] } => {
		const calls: number[] = [];
		return {
			calls,
			probe: vi.fn(async (quality: number) => {
				calls.push(quality);
				const size = Math.max(100, Math.round(10_000 / quality)); // 20→500, 95→105
				return { quality, blob: new Blob([new Uint8Array(size)]), size };
			})
		};
	};

	it('finds the best quality under budget (within tolerance)', async () => {
		const { probe, calls } = makeProbe();
		const res = await encodeWithinBudget(probe, 300);
		expect(res.size).toBeLessThanOrEqual(300 * 1.1);
		expect(res.quality).toBeGreaterThanOrEqual(20);
		expect(calls.length).toBeLessThanOrEqual(6);
	});

	it('respects quality bounds and returns the floor when all fail', async () => {
		const { probe, calls } = makeProbe();
		const res = await encodeWithinBudget(probe, 10); // même qMin déborde
		expect(res.quality).toBe(20);
		expect(calls.length).toBeLessThanOrEqual(6);
	});

	it('uses the best (highest) quality that still fits', async () => {
		const { probe } = makeProbe();
		const res = await encodeWithinBudget(probe, 5000); // tout rentre
		expect(res.quality).toBeGreaterThanOrEqual(90);
	});
});