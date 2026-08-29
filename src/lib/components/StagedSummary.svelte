<script lang="ts">
	import { X } from '@lucide/svelte';
	import FileThumb from './FileThumb.svelte';
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings.svelte';
	import { formatBytes } from '$lib/utils/files';
	import type { QueueJob } from '$lib/queue/controller';

	let {
		jobs,
		inputUrls,
		onRemove
	}: {
		jobs: QueueJob[];
		inputUrls: Map<string, string>;
		onRemove: (id: string) => void;
	} = $props();
</script>

<section class="summary" aria-label={t(settings.lang, 'queue.readyTitle')}>
	<header class="summary__header">
		<strong>{t(settings.lang, 'queue.readyTitle')}</strong>
		<span class="nums summary__count"
			>{t(settings.lang, 'queue.count', { n: String(jobs.length) })}</span
		>
	</header>

	<ul class="summary__list">
		{#each jobs as job (job.id)}
			<li class="summary__row">
				<FileThumb src={inputUrls.get(job.id) ?? ''} name={job.name} size={40} />
				<div class="summary__meta">
					<span class="summary__name" title={job.name}>{job.name}</span>
					<small class="nums summary__size">{formatBytes(job.inputSize, settings.lang)}</small>
				</div>
				<button
					type="button"
					class="summary__remove"
					aria-label={t(settings.lang, 'queue.remove')}
					onclick={() => onRemove(job.id)}
				>
					<X size={14} strokeWidth={1.75} aria-hidden="true" />
				</button>
			</li>
		{/each}
	</ul>
</section>

<style>
	.summary {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--r-card);
		box-shadow: var(--shadow-card);
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.summary__header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
	}
	.summary__header strong {
		font-size: 13px;
		font-weight: 600;
		color: var(--text);
	}
	.summary__count {
		font-size: 12px;
		color: var(--text-3);
	}
	.summary__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.summary__row {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}
	.summary__meta {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.summary__name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 13px;
		color: var(--text);
	}
	.summary__size {
		font-size: 11px;
		color: var(--text-4);
	}
	.summary__remove {
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 7px;
		color: var(--text-4);
		transition:
			background-color var(--dur) var(--ease),
			color var(--dur) var(--ease);
	}
	.summary__remove:hover {
		background: var(--surface);
		color: var(--danger-text);
	}
</style>
