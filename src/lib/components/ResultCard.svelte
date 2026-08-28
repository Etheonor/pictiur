<script lang="ts">
	import { CircleAlert, Columns2, Download, Upload } from '@lucide/svelte';
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings.svelte';
	import { formatBytes, outputFileName } from '$lib/utils/files';
	import type { QueueJob } from '$lib/queue/controller';

	let {
		job,
		inputUrl,
		onCompare,
		onRemove
	}: {
		job: QueueJob;
		inputUrl: string;
		onCompare?: (job: QueueJob) => void;
		onRemove?: (id: string) => void;
	} = $props();

	const FORMAT_LABELS: Record<string, string> = {
		jpeg: 'JPEG',
		png: 'PNG',
		webp: 'WebP',
		avif: 'AVIF',
		jxl: 'JPEG XL'
	};

	const result = $derived(job.result!);
	const formatLabel = $derived(FORMAT_LABELS[job.format] ?? job.format.toUpperCase());
	const improved = $derived(result.outputSize < job.inputSize);
	const diff = $derived(Math.round(((job.inputSize - result.outputSize) / job.inputSize) * 100));
	const gainLabel = $derived(improved ? `−${diff} %` : diff === 0 ? '−0 %' : `+${-diff} %`);
	const weightLabel = $derived(formatBytes(result.outputSize, settings.lang));
	const filename = $derived(outputFileName(job.name, result.mime));
	let previewFailed = $state(false);
</script>

<article
	class="result-card result-card--{job.status}"
	class:animate={job.status === 'done' && job.result}
>
	{#if job.status === 'done' && job.result}
		{#if previewFailed}
			<div class="preview preview--fallback" role="img" aria-label={job.name}>
				<small>{t(settings.lang, 'result.previewUnsupported')}</small>
			</div>
		{:else}
			<div class="preview">
				<img
					src={result.url}
					alt={job.name}
					loading="lazy"
					onerror={() => (previewFailed = true)}
				/>
			</div>
			<span class="badge">{formatLabel}</span>
		{/if}

		<div class="body">
			<strong class="name" title={job.name}>{job.name}</strong>
			<small class="info nums">
				<span>{result.width}×{result.height}</span>
				<span class="dot">·</span>
				<span class={improved ? 'gain' : 'gain gain--flat'}>
					{gainLabel}
					{weightLabel}
				</span>
			</small>
			{#if !improved}
				<small class="nogain">{t(settings.lang, 'result.noGain')}</small>
			{/if}

			<div class="actions">
				{#if onCompare}
					<button type="button" class="btn btn--ghost" onclick={() => onCompare(job)}>
						<Columns2 size={13} strokeWidth={1.75} aria-hidden="true" />
						{t(settings.lang, 'result.compare')}
					</button>
				{/if}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={result.url} download={filename} class="btn btn--primary" role="button">
					<Download size={13} strokeWidth={1.75} aria-hidden="true" />
					{t(settings.lang, 'result.download')}
				</a>
				{#if !improved && inputUrl}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={inputUrl} download={job.name} class="btn btn--secondary" role="button">
						<Upload size={13} strokeWidth={1.75} aria-hidden="true" />
						{t(settings.lang, 'result.keepOriginal')}
					</a>
				{/if}
			</div>
		</div>
	{:else}
		<div class="error-body">
			<span class="pill">{t(settings.lang, `job.${job.status}`)}</span>
			{#if job.status === 'error'}
				<small class="error-msg">
					<CircleAlert size={14} strokeWidth={1.75} aria-hidden="true" />
					<span>{job.error}</span>
				</small>
			{:else}
				<small class="name" title={job.name}>{job.name}</small>
			{/if}
			{#if onRemove}
				<button type="button" class="btn btn--danger" onclick={() => onRemove(job.id)}>
					{t(settings.lang, 'queue.remove')}
				</button>
			{/if}
		</div>
	{/if}
</article>

<style>
	.result-card {
		position: relative;
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--r-card);
		box-shadow: var(--shadow-card);
		overflow: hidden;
		transition:
			transform var(--dur) var(--ease),
			box-shadow var(--dur) var(--ease);
	}
	.result-card--done:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-card-hover);
	}
	.result-card.animate {
		animation: fadeIn 0.2s var(--ease);
	}

	/* --- done: preview --- */
	.preview {
		aspect-ratio: 4 / 3;
		background: var(--surface-dim);
		overflow: hidden;
	}
	.preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s var(--ease);
	}
	.result-card:hover .preview img {
		transform: scale(1.02);
	}
	.preview--fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		text-align: center;
		background: repeating-linear-gradient(45deg, #1d1d1d, #1d1d1d 8px, #212121 8px, #212121 16px);
	}
	.preview--fallback small {
		font-size: 12px;
		color: var(--text-3);
		max-width: 80%;
	}
	.badge {
		position: absolute;
		top: 8px;
		left: 8px;
		font-size: 11px;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 6px;
		background: rgba(12, 31, 26, 0.85);
		color: var(--accent);
		backdrop-filter: blur(4px);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 14px 16px 16px;
		min-height: 118px;
	}
	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 13px;
		font-weight: 600;
		color: var(--text);
	}
	.info {
		display: flex;
		align-items: baseline;
		gap: 6px;
		font-size: 12px;
		color: var(--text-3);
	}
	.info .dot {
		color: var(--text-4);
	}
	.gain {
		color: var(--accent);
		font-weight: 700;
	}
	.gain--flat {
		color: var(--text-3);
		font-weight: 500;
	}
	.nogain {
		font-size: 12px;
		color: var(--text-4);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: auto;
	}
	.actions .btn {
		flex: 1;
		min-width: 120px;
	}
	.actions a.btn {
		text-decoration: none;
	}

	/* --- error / aborted --- */
	.result-card--error {
		background: var(--danger-tint);
		border-color: var(--danger-border);
	}
	.result-card--aborted {
		opacity: 0.7;
		background: var(--surface-dim);
		border: 1px dashed var(--border-input);
	}
	.error-body {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
		padding: 16px;
		min-height: 120px;
	}
	.pill {
		font-size: 11px;
		font-weight: 600;
		padding: 4px 10px;
		border-radius: var(--r-pill);
	}
	.result-card--error .pill {
		background: var(--danger-tint);
		border: 1px solid var(--danger-border);
		color: var(--danger-text);
	}
	.result-card--aborted .pill {
		background: var(--surface-input);
		border: 1px solid var(--border-input);
		color: var(--text-3);
	}
	.error-msg {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		font-size: 12px;
		color: var(--danger-text);
		line-height: 1.45;
	}
</style>
