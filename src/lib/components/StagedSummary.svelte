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

	<ul class="summary__grid">
		{#each jobs as job (job.id)}
			{@const tr = transformOf(job.id)}
			<li class="tile">
				<div class="tile__preview">
					<FileThumb
						src={inputUrls.get(job.id) ?? ''}
						name={job.name}
						fluid
						fit="contain"
						imageStyle={thumbStyle(tr)}
					/>
					{#if !isIdentity(tr)}
						<span class="tile__badge">{badge(tr)}</span>
					{/if}
					<button
						type="button"
						class="tile__remove"
						aria-label={t(settings.lang, 'queue.remove')}
						onclick={() => onRemove(job.id)}
					>
						<X size={14} strokeWidth={1.75} aria-hidden="true" />
					</button>
				</div>

				<div class="tile__info">
					<span class="tile__name" title={job.name}>{job.name}</span>
					<small class="nums tile__size">{formatBytes(job.inputSize, settings.lang)}</small>
				</div>

				<div class="tile__tools">
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
						<RotateCcw size={15} strokeWidth={1.75} aria-hidden="true" />
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
						<RotateCw size={15} strokeWidth={1.75} aria-hidden="true" />
					</button>
					<button
						type="button"
						class="tool"
						class:tool--on={tr.flipH}
						title={t(settings.lang, 'transform.flipH')}
						aria-label={t(settings.lang, 'transform.flipH')}
						onclick={() => onTransform(job.id, { flipH: !tr.flipH })}
					>
						<FlipHorizontal2 size={15} strokeWidth={1.75} aria-hidden="true" />
					</button>
					<button
						type="button"
						class="tool"
						class:tool--on={tr.flipV}
						title={t(settings.lang, 'transform.flipV')}
						aria-label={t(settings.lang, 'transform.flipV')}
						onclick={() => onTransform(job.id, { flipV: !tr.flipV })}
					>
						<FlipVertical2 size={15} strokeWidth={1.75} aria-hidden="true" />
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
		gap: 14px;
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
	.summary__grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 14px;
	}

	.tile {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}
	.tile__preview {
		position: relative;
		aspect-ratio: 1 / 1;
		border-radius: 10px;
		overflow: hidden;
		background: var(--surface-dim);
		border: 1px solid var(--border-input);
	}
	.tile__badge {
		position: absolute;
		top: 8px;
		left: 8px;
		font-size: 11px;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: var(--r-pill);
		background: rgba(12, 31, 26, 0.85);
		color: var(--accent);
		backdrop-filter: blur(4px);
	}
	.tile__remove {
		position: absolute;
		top: 8px;
		right: 8px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.55);
		color: #fff;
		backdrop-filter: blur(4px);
		transition: background-color var(--dur) var(--ease);
	}
	.tile__remove:hover {
		background: var(--danger);
	}
	.tile__info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.tile__name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 13px;
		font-weight: 500;
		color: var(--text);
	}
	.tile__size {
		font-size: 11px;
		color: var(--text-4);
	}
	.tile__tools {
		display: flex;
		gap: 4px;
	}
	.tool {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 34px;
		border-radius: 8px;
		background: var(--surface-input);
		border: 1px solid var(--border-input);
		color: var(--text-2);
		transition:
			background-color var(--dur) var(--ease),
			border-color var(--dur) var(--ease),
			color var(--dur) var(--ease);
	}
	.tool:hover {
		border-color: var(--border-hover);
		color: var(--text);
	}
	.tool--on {
		background: var(--accent-tint-14);
		border-color: var(--accent);
		color: var(--accent);
	}
</style>
