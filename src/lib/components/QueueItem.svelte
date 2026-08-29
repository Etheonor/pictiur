<script lang="ts">
	import { Clock, X } from '@lucide/svelte';
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings.svelte';
	import type { QueueJob } from '$lib/queue/controller';

	let {
		job,
		position,
		inputUrl,
		onRemove
	}: {
		job: QueueJob;
		position: number;
		inputUrl: string;
		onRemove?: (id: string) => void;
	} = $props();

	const statusLabel = $derived(t(settings.lang, `job.${job.status}`));
	const formatLabel = $derived(job.format.toUpperCase());
	const ext = $derived((job.name.split('.').pop() ?? '').toUpperCase());
	let thumbFailed = $state(false);
</script>

<article class="queue-item queue-item--{job.status}" aria-busy={job.status === 'processing'}>
	<div class="thumb" aria-hidden="true">
		{#if thumbFailed}
			<span class="thumb__ext">{ext}</span>
		{:else}
			<img src={inputUrl} alt="" loading="lazy" onerror={() => (thumbFailed = true)} />
		{/if}
	</div>

	<div class="body">
		<div class="row">
			<strong class="name" title={job.name}>{job.name}</strong>
			<div class="row__right">
				<span class="pill">{statusLabel}</span>
				{#if job.status === 'ready' && onRemove}
					<button
						type="button"
						class="remove"
						aria-label={t(settings.lang, 'queue.remove')}
						onclick={() => onRemove(job.id)}
					>
						<X size={13} strokeWidth={1.75} aria-hidden="true" />
					</button>
				{/if}
			</div>
		</div>

		{#if job.status === 'ready' || job.status === 'queued'}
			<small class="meta">
				<Clock size={13} strokeWidth={1.75} aria-hidden="true" />
				<span>{t(settings.lang, 'queue.position', { n: String(position) })}</span>
			</small>
		{:else if job.status === 'processing'}
			<small class="meta nums">
				<span>{job.progress} % · {t(settings.lang, 'job.encoding', { format: formatLabel })}</span>
			</small>
			<div
				class="bar"
				role="progressbar"
				aria-valuenow={job.progress}
				aria-valuemin="0"
				aria-valuemax="100"
			>
				<div class="bar__fill" style="width: {job.progress}%">
					<span class="bar__shimmer" aria-hidden="true"></span>
				</div>
			</div>
		{/if}

		{#if job.error}<small class="error">{job.error}</small>{/if}
	</div>
</article>

<style>
	.queue-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 12px;
		border-radius: var(--r-card);
		box-shadow: var(--shadow-card);
		min-width: 0;
	}
	.queue-item--queued {
		background: var(--surface-dim);
		border: 1px dashed var(--border-input);
	}
	.queue-item--ready {
		background: var(--surface-dim);
		border: 1px dashed var(--border-input);
	}
	.queue-item--processing {
		background: var(--surface);
		border: 1px solid var(--border);
	}

	.thumb {
		flex: none;
		width: 56px;
		height: 56px;
		border-radius: 8px;
		background: var(--surface-input);
		border: 1px solid var(--border-input);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.thumb__ext {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--text-3);
	}

	.body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-width: 0;
	}
	.row__right {
		flex: none;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 13px;
		font-weight: 600;
		color: var(--text);
	}
	.pill {
		flex: none;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.02em;
		padding: 4px 10px;
		border-radius: var(--r-pill);
		white-space: nowrap;
	}
	.queue-item--queued .pill,
	.queue-item--ready .pill {
		background: var(--surface-input);
		border: 1px solid var(--border-input);
		color: var(--text-3);
	}
	.queue-item--processing .pill {
		background: var(--accent-tint-14);
		color: var(--accent);
	}
	.remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 6px;
		color: var(--text-4);
		transition:
			background-color var(--dur) var(--ease),
			color var(--dur) var(--ease);
	}
	.remove:hover {
		background: var(--surface);
		color: var(--danger-text);
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: var(--text-3);
	}
	.error {
		font-size: 12px;
		color: var(--danger-text);
	}
	.bar {
		height: 4px;
		border-radius: var(--r-pill);
		background: #2a2a2a;
		overflow: hidden;
	}
	.bar__fill {
		position: relative;
		height: 100%;
		border-radius: var(--r-pill);
		background: var(--accent);
		transition: width 0.2s var(--ease);
		overflow: hidden;
	}
	.bar__shimmer {
		position: absolute;
		inset: 0;
		width: 45%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
		animation: shimmer 1.4s var(--ease) infinite;
	}

	@media (max-width: 720px) {
		.thumb {
			width: 48px;
			height: 48px;
		}
	}
</style>
