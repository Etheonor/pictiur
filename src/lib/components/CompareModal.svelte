<script lang="ts">
	import { ChevronsLeftRight, Download, X } from '@lucide/svelte';
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings.svelte';
	import { formatBytes, outputFileName } from '$lib/utils/files';
	import type { QueueJob } from '$lib/queue/controller';

	let { job, inputUrl, onClose }: { job: QueueJob; inputUrl: string; onClose: () => void } =
		$props();

	const result = $derived(job.result!);
	let pos = $state(50);
	let stage: HTMLDivElement | undefined = $state();

	const beforeLabel = $derived(formatBytes(job.inputSize, settings.lang));
	const afterLabel = $derived(formatBytes(result.outputSize, settings.lang));
	const improved = $derived(result.outputSize < job.inputSize);
	const diff = $derived(Math.round(((job.inputSize - result.outputSize) / job.inputSize) * 100));
	const gainLabel = $derived(improved ? `−${diff} %` : diff === 0 ? '−0 %' : `+${-diff} %`);
	const filename = $derived(outputFileName(job.name, result.mime));

	$effect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
			else if (e.key === 'ArrowLeft') pos = Math.max(0, pos - 3);
			else if (e.key === 'ArrowRight') pos = Math.min(100, pos + 3);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	// Verrouille le scroll du body pendant la modale
	$effect(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});

	function updateFromPointer(e: PointerEvent): void {
		const rect = stage?.getBoundingClientRect();
		if (!rect) return;
		const pct = ((e.clientX - rect.left) / rect.width) * 100;
		pos = Math.min(100, Math.max(0, pct));
	}
	function onPointerDown(e: PointerEvent): void {
		stage?.setPointerCapture?.(e.pointerId);
		updateFromPointer(e);
	}
	function onPointerMove(e: PointerEvent): void {
		if (e.buttons > 0) updateFromPointer(e);
	}
	function onPointerUp(e: PointerEvent): void {
		stage?.releasePointerCapture?.(e.pointerId);
	}
</script>

<div class="overlay" onclick={onClose} role="presentation">
	<div
		class="modal"
		role="dialog"
		aria-modal="true"
		aria-label={job.name}
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
	>
		<header class="header">
			<strong class="title" title={job.name}>{job.name}</strong>
			<button type="button" class="btn btn--icon" aria-label="Fermer" onclick={onClose}>
				<X size={16} strokeWidth={1.75} aria-hidden="true" />
			</button>
		</header>

		<div
			class="stage"
			bind:this={stage}
			role="slider"
			tabindex="0"
			aria-label="comparaison"
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow={Math.round(pos)}
			style="cursor: col-resize; touch-action: none;"
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointercancel={onPointerUp}
		>
			<img class="stage__img stage__img--before" src={inputUrl} alt={`${job.name} (avant)`} />
			<div class="stage__after" style="clip-path: inset(0 0 0 {pos}%);">
				<img class="stage__img" src={result.url} alt={`${job.name} (après)`} />
			</div>
			<div class="handle" style="left: {pos}%;">
				<ChevronsLeftRight size={16} strokeWidth={2} aria-hidden="true" />
			</div>
			<span class="label label--before">{t(settings.lang, 'compare.before')}</span>
			<span class="label label--after">{t(settings.lang, 'compare.after')}</span>
		</div>

		<footer class="footer">
			<small class="nums recap">
				<span class="nums">{beforeLabel} → {afterLabel}</span>
				<span class="recap__gain">{gainLabel}</span>
			</small>
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={result.url} download={filename} class="btn btn--primary" role="button">
				<Download size={13} strokeWidth={1.75} aria-hidden="true" />
				{t(settings.lang, 'result.download')}
			</a>
		</footer>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		background: rgba(0, 0, 0, 0.72);
		backdrop-filter: blur(6px);
		animation: fadeInOverlay 0.15s var(--ease);
	}
	.modal {
		width: min(820px, 100%);
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--r-card);
		box-shadow: var(--shadow-modal);
		overflow: hidden;
		animation: fadeIn 0.2s var(--ease);
	}
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 16px;
		border-bottom: 1px solid var(--border);
	}
	.title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 14px;
		font-weight: 600;
	}
	.stage {
		position: relative;
		aspect-ratio: 3 / 2;
		background: #000;
		overflow: hidden;
		user-select: none;
		-webkit-user-select: none;
	}
	.stage__img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.stage__img--before {
		background: var(--surface-dim);
	}
	.stage__after {
		position: absolute;
		inset: 0;
	}
	.handle {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		background: var(--accent);
		box-shadow: 0 0 12px rgba(45, 212, 167, 0.6);
		pointer-events: none;
	}
	.handle :global(svg) {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		padding: 9px;
		width: 36px;
		height: 36px;
		box-sizing: border-box;
		border-radius: 50%;
		background: var(--accent);
		color: var(--accent-ink);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
	}
	.label {
		position: absolute;
		top: 12px;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.08em;
		padding: 4px 10px;
		border-radius: 6px;
		background: rgba(0, 0, 0, 0.55);
		color: var(--text-2);
		pointer-events: none;
		animation: fadeOutLabels 3s var(--ease) forwards;
	}
	.label--before {
		left: 12px;
	}
	.label--after {
		right: 12px;
	}
	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 14px 16px;
		border-top: 1px solid var(--border);
	}
	.recap {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 12px;
		color: var(--text-3);
	}
	.recap__gain {
		color: var(--accent);
		font-weight: 700;
		font-size: 13px;
	}
	.footer a.btn {
		text-decoration: none;
		flex: none;
	}

	@keyframes fadeOutLabels {
		0%,
		60% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
