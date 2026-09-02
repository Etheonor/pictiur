<script lang="ts">
	import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw, X } from '@lucide/svelte';
	import FileThumb from './FileThumb.svelte';
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings.svelte';
	import { formatBytes } from '$lib/utils/files';
	import type { QueueJob } from '$lib/queue/controller';
	import { IDENTITY_TRANSFORM, isIdentity, type ImageTransform } from '$lib/pipeline/transform';

	let {
		jobs,
		inputUrls,
		transforms,
		onRemove,
		onTransform
	}: {
		jobs: QueueJob[];
		inputUrls: Map<string, string>;
		transforms: Map<string, ImageTransform>;
		onRemove: (id: string) => void;
		onTransform: (id: string, patch: Partial<ImageTransform>) => void;
	} = $props();

	function transformOf(id: string): ImageTransform {
		return transforms.get(id) ?? IDENTITY_TRANSFORM;
	}
	function badge(t0: ImageTransform): string {
		const parts: string[] = [];
		if (t0.rotate) parts.push(`${t0.rotate}°`);
		if (t0.flipH) parts.push('↔');
		if (t0.flipV) parts.push('↕');
		return parts.join(' · ');
	}
	function thumbStyle(t0: ImageTransform): string {
		return `transform: rotate(${t0.rotate ?? 0}deg) scaleX(${t0.flipH ? -1 : 1}) scaleY(${t0.flipV ? -1 : 1});`;
	}
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
			{@const tr = transformOf(job.id)}
			<li class="summary__row">
				<FileThumb
					src={inputUrls.get(job.id) ?? ''}
					name={job.name}
					size={40}
					imageStyle={thumbStyle(tr)}
				/>
				<div class="summary__meta">
					<span class="summary__name" title={job.name}>{job.name}</span>
					<small class="nums summary__size">
						{formatBytes(job.inputSize, settings.lang)}
						{#if !isIdentity(tr)}
							<span class="summary__badge">{badge(tr)}</span>
						{/if}
					</small>
				</div>
				<div class="summary__tools">
					<button
						type="button"
						class="tool"
						title={t(settings.lang, 'transform.rotateLeft')}
						aria-label={t(settings.lang, 'transform.rotateLeft')}
						onclick={() =>
							onTransform(job.id, {
								rotate: (((tr.rotate ?? 0) + 270) % 360) as 0 | 90 | 180 | 270
							})}
					>
						<RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
					</button>
					<button
						type="button"
						class="tool"
						title={t(settings.lang, 'transform.rotateRight')}
						aria-label={t(settings.lang, 'transform.rotateRight')}
						onclick={() =>
							onTransform(job.id, {
								rotate: (((tr.rotate ?? 0) + 90) % 360) as 0 | 90 | 180 | 270
							})}
					>
						<RotateCw size={14} strokeWidth={1.75} aria-hidden="true" />
					</button>
					<button
						type="button"
						class="tool"
						class:tool--on={tr.flipH}
						title={t(settings.lang, 'transform.flipH')}
						aria-label={t(settings.lang, 'transform.flipH')}
						onclick={() => onTransform(job.id, { flipH: !tr.flipH })}
					>
						<FlipHorizontal2 size={14} strokeWidth={1.75} aria-hidden="true" />
					</button>
					<button
						type="button"
						class="tool"
						class:tool--on={tr.flipV}
						title={t(settings.lang, 'transform.flipV')}
						aria-label={t(settings.lang, 'transform.flipV')}
						onclick={() => onTransform(job.id, { flipV: !tr.flipV })}
					>
						<FlipVertical2 size={14} strokeWidth={1.75} aria-hidden="true" />
					</button>
					<button
						type="button"
						class="summary__remove"
						aria-label={t(settings.lang, 'queue.remove')}
						onclick={() => onRemove(job.id)}
					>
						<X size={14} strokeWidth={1.75} aria-hidden="true" />
					</button>
				</div>
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
	.summary__badge {
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: var(--r-pill);
		background: var(--accent-tint-14);
		color: var(--accent);
		font-weight: 600;
	}
	.summary__tools {
		flex: none;
		display: flex;
		align-items: center;
		gap: 2px;
	}
	.tool {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 6px;
		color: var(--text-3);
		transition:
			background-color var(--dur) var(--ease),
			color var(--dur) var(--ease);
	}
	.tool:hover {
		background: var(--surface);
		color: var(--text);
	}
	.tool--on {
		background: var(--accent-tint-14);
		color: var(--accent);
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
