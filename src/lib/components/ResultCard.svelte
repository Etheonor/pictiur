<script lang="ts">
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings.svelte';
	import { outputFileName } from '$lib/utils/files';
	import CompareSlider from './CompareSlider.svelte';
	import type { QueueJob } from '$lib/queue/controller';

	let { job, inputUrl }: { job: QueueJob; inputUrl: string } = $props();
	let compare = $state(false);

	const result = $derived(job.result!);
	const pct = $derived(
		job.inputSize > result.outputSize
			? Math.round(((job.inputSize - result.outputSize) / job.inputSize) * 100)
			: 0
	);
	const filename = $derived(outputFileName(job.name, result.mime));
</script>

<article class="card">
	{#if compare}
		<CompareSlider beforeUrl={inputUrl} afterUrl={result.url} alt={job.name} />
	{:else}
		<img src={result.url} alt={job.name} class="thumb" />
	{/if}

	<div class="meta">
		<span>{result.width}×{result.height}</span>
		<span class="saved" class:neg={pct === 0}>−{pct} %</span>
	</div>

	<div class="actions">
		<button type="button" onclick={() => (compare = !compare)}
			>{t(settings.lang, 'result.compare')}</button
		>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={result.url} download={filename}>{t(settings.lang, 'result.download')}</a>
	</div>
</article>

<style>
	.card {
		border: 1px solid var(--border);
		border-radius: 10px;
		overflow: hidden;
		background: var(--surface);
	}
	.thumb {
		display: block;
		width: 100%;
		height: auto;
	}
	.meta {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0.7rem;
		font-size: 0.85rem;
		opacity: 0.9;
	}
	.saved {
		color: var(--ok);
	}
	.saved.neg {
		color: var(--muted);
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		padding: 0 0.7rem 0.7rem;
	}
	.actions button,
	.actions a {
		flex: 1;
		text-align: center;
		text-decoration: none;
	}
</style>
