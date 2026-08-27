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

<article>
	{#if compare}
		<CompareSlider beforeUrl={inputUrl} afterUrl={result.url} alt={job.name} />
	{:else}
		<img src={result.url} alt={job.name} style="display:block; width:100%; height:auto;" />
	{/if}

	<footer style="display:flex; justify-content:space-between; align-items:center;">
		<small>{result.width}×{result.height}</small>
		<small style={pct === 0 ? 'color: var(--pico-muted-color);' : 'color: var(--pico-ins-color);'}
			>−{pct} %</small
		>
	</footer>

	<div style="display:flex; gap:.5rem;">
		<button type="button" onclick={() => (compare = !compare)}
			>{t(settings.lang, 'result.compare')}</button
		>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={result.url} download={filename} role="button">{t(settings.lang, 'result.download')}</a>
	</div>
</article>
