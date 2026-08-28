import { WorkerPool } from './pool';
import type { PoolWorker } from './pool';

function createBrowserWorker(): PoolWorker {
	const worker = new Worker(new URL('./codec.worker.ts', import.meta.url), { type: 'module' });
	return {
		postMessage(message: unknown, transfer?: Transferable[]): void {
			worker.postMessage(message, transfer ?? []);
		},
		set onmessage(handler: ((event: { data: unknown }) => void) | null) {
			worker.onmessage = handler ? (event) => handler({ data: event.data }) : null;
		},
		get onmessage() {
			return null;
		},
		set onerror(handler: ((event: unknown) => void) | null) {
			worker.onerror = handler ?? null;
		},
		get onerror() {
			return null;
		},
		terminate(): void {
			worker.terminate();
		}
	};
}

/** Real browser pool: N = cores - 1 (PLAN §3.3). */
export function createBrowserPool(size?: number): WorkerPool {
	const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
	return new WorkerPool(size ?? Math.max(1, cores - 1), createBrowserWorker);
}

export { WorkerPool } from './pool';
export type { PoolResult } from './pool';
