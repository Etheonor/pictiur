<script lang="ts">
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings.svelte';
	import type { QueueJob } from '$lib/queue/controller';

	let { job }: { job: QueueJob } = $props();
</script>

<article>
	<div style="display:flex; justify-content:space-between; align-items:baseline; gap:1rem;">
		<strong style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title={job.name}
			>{job.name}</strong
		>
		<small
			style={job.status === 'done'
				? 'color: var(--pico-ins-color);'
				: job.status === 'error' || job.status === 'aborted'
					? 'color: var(--pico-del-color);'
					: ''}
		>
			{t(settings.lang, `job.${job.status}`)}
		</small>
	</div>

	{#if job.status === 'processing' || job.status === 'queued'}
		<progress value={job.progress} max="100"></progress>
	{/if}

	{#if job.error}<small style="color: var(--pico-del-color);">{job.error}</small>{/if}
</article>
