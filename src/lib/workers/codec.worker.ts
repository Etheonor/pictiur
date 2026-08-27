// Worker dédié : exécute une pipeline complète par message.
// ⚠️ On n'importe PAS la lib TS "WebWorker" (conflit avec DOM) : on caste `self` à la main.
import { runPipeline } from '../pipeline';
import type { PipelineEnv } from '../pipeline';
import type { PipelineOptions } from '../pipeline/job';

export interface WorkerJob {
	id: string;
	name?: string;
	mime: string;
	buffer: ArrayBuffer;
	options: PipelineOptions;
}

export type WorkerResponse =
	| { kind: 'progress'; id: string; progress: number }
	| {
			kind: 'result';
			id: string;
			mime: string;
			width: number;
			height: number;
			inputSize: number;
			outputSize: number;
			qualityUsed?: number;
			buffer: ArrayBuffer;
	  }
	| { kind: 'error'; id: string; error: string };

export type WorkerCommand = WorkerJob | { kind: 'cancel'; id: string };

export interface WorkerHooks {
	onProgress?: (progress: number) => void;
	env?: PipelineEnv; // injectable pour les tests
	shouldCancel?: () => boolean;
}

export async function handleWorkerJob(
	job: WorkerJob,
	hooks: WorkerHooks = {}
): Promise<WorkerResponse> {
	try {
		const file = new File([job.buffer], job.name ?? 'image', { type: job.mime });
		const result = await runPipeline(
			{ file, mime: job.mime, options: job.options },
			{ onProgress: hooks.onProgress, shouldCancel: hooks.shouldCancel, ...hooks.env }
		);
		const buffer = await result.blob.arrayBuffer();
		return {
			kind: 'result',
			id: job.id,
			mime: result.mime,
			width: result.width,
			height: result.height,
			inputSize: result.inputSize,
			outputSize: result.outputSize,
			qualityUsed: result.qualityUsed,
			buffer
		};
	} catch (error) {
		return {
			kind: 'error',
			id: job.id,
			error: error instanceof Error ? error.message : String(error)
		};
	}
}

// --- wiring navigateur -------------------------------------------------
// Guarded so the module can be imported in Node (Vitest) without a `self`.
if (typeof self !== 'undefined') {
	const cancelled = new Set<string>();

	const workerSelf = self as unknown as {
		onmessage: ((event: { data: WorkerCommand }) => void) | null;
		postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
	};

	workerSelf.onmessage = (event) => {
		const command = event.data;
		if ('kind' in command && command.kind === 'cancel') {
			cancelled.add(command.id);
			return;
		}
		const job = command as WorkerJob;
		void handleWorkerJob(job, {
			onProgress: (progress) => {
				workerSelf.postMessage({ kind: 'progress', id: job.id, progress });
			},
			shouldCancel: () => cancelled.has(job.id)
		}).then((response) => {
			cancelled.delete(job.id);
			if (response.kind === 'result') {
				workerSelf.postMessage(response, [response.buffer]); // transfert zéro-copie
			} else {
				workerSelf.postMessage(response);
			}
		});
	};
}
