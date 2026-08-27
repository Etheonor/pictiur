<script lang="ts">
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings.svelte';
	import type { QueueJob } from '$lib/queue/controller';

	let { job }: { job: QueueJob } = $props();
</script>

<li class="item">
	<div class="head">
		<span class="name" title={job.name}>{job.name}</span>
		<span class="badge" class:done={job.status === 'done'} class:err={job.status === 'error'}>
			{t(settings.lang, `job.${job.status}`)}
		</span>
	</div>

	{#if job.status === 'processing' || job.status === 'queued'}
		<div class="track"><div class="bar" style={`width: ${job.progress}%`}></div></div>
	{/if}

	{#if job.error}<p class="error">{job.error}</p>{/if}
</li>

<style>
	.item {
		padding: 0.6rem 0;
		border-bottom: 1px solid var(--border);
	}
	.head {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.badge {
		opacity: 0.8;
		font-size: 0.8rem;
	}
	.badge.done {
		color: var(--ok);
	}
	.badge.err {
		color: var(--err);
	}
	.track {
		height: 6px;
		background: var(--surface-2);
		border-radius: 3px;
		margin-top: 0.4rem;
	}
	.bar {
		height: 100%;
		background: var(--accent);
		border-radius: 3px;
		transition: width 0.2s;
	}
	.error {
		color: var(--err);
		font-size: 0.8rem;
		margin: 0.3rem 0 0;
	}
</style>