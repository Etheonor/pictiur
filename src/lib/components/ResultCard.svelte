<script lang="ts">
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings.svelte';
	import { outputFileName } from '$lib/utils/files';
	import CompareSlider from './CompareSlider.svelte';
	import type { QueueJob } from '$lib/queue/controller';

	let { job, inputUrl }: { job: QueueJob; inputUrl: string } = $props();
	let compare = $state(false);
	let previewFailed = $state(false);

	const result = $derived(job.result!);
	const improved = $derived(result.outputSize < job.inputSize);
	const pct = $derived(
		improved ? Math.round(((job.inputSize - result.outputSize) / job.inputSize) * 100) : 0
	);
	const filename = $derived(outputFileName(job.name, result.mime));
	const originalName = $derived(job.name);
</script>

<article>
	{#if compare}
		<CompareSlider beforeUrl={inputUrl} afterUrl={result.url} alt={job.name} />
	{:else if previewFailed}
		<div
			style="display:flex; align-items:center; justify-content:center; min-height:8rem; background:var(--pico-muted-color); border-radius:.5rem; color:var(--pico-color); text-align:center; padding:1rem;"
		>
			<small>{t(settings.lang, 'result.previewUnsupported')}</small>
		</div>
	{:else}
		<img
			src={result.url}
			alt={job.name}
			style="display:block; width:100%; height:auto;"
			onerror={() => (previewFailed = true)}
		/>
	{/if}

	<footer style="display:flex; justify-content:space-between; align-items:center;">
		<small>{result.width}×{result.height}</small>
		{#if improved}
			<small style="color: var(--pico-ins-color);">−{pct} %</small>
		{:else}
			<small style="color: var(--pico-muted-color);">{t(settings.lang, 'result.noGain')}</small>
		{/if}
	</footer>

	<div style="display:flex; gap:.5rem;">
		<button type="button" onclick={() => (compare = !compare)}
			>{t(settings.lang, 'result.compare')}</button
		>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={result.url} download={filename} role="button">{t(settings.lang, 'result.download')}</a>
		{#if !improved && inputUrl}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={inputUrl} download={originalName} role="button" class="secondary"
				>{t(settings.lang, 'result.keepOriginal')}</a
			>
		{/if}
	</div>
</article>
