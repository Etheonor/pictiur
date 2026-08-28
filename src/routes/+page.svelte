<script lang="ts">
	import { onMount } from 'svelte';
	import { Archive, Globe, Image, LoaderCircle, TriangleAlert, X } from '@lucide/svelte';
	import DropZone from '$lib/components/DropZone.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import QueueItem from '$lib/components/QueueItem.svelte';
	import ResultCard from '$lib/components/ResultCard.svelte';
	import CompareModal from '$lib/components/CompareModal.svelte';
	import { listCodecs } from '$lib/codecs';
	import { JobQueueController, type QueueJob } from '$lib/queue/controller';
	import { settings, updateSettings } from '$lib/stores/settings.svelte';
	import { saveSettings } from '$lib/stores/settings';
	import { filesFromList, toPipelineOptions, type InputFile } from '$lib/utils/files';
	import { buildZip } from '$lib/utils/zip';
	import { createBrowserPool } from '$lib/workers';
	import { t } from '$lib/i18n';

	let controller: JobQueueController | undefined = $state();
	let formats: { id: string; label: string }[] = $state([]);
	let jobs = $state<QueueJob[]>([]);
	let inputUrls = $state<Map<string, string>>(new Map());
	let errors = $state<string[]>([]);
	let zipping = $state(false);
	let compareJob = $state<QueueJob | null>(null);

	const doneCount = $derived(jobs.filter((j) => j.status === 'done' && j.result).length);
	const processedCount = $derived(
		jobs.filter((j) => ['done', 'error', 'aborted'].includes(j.status)).length
	);

	onMount(async () => {
		const pool = createBrowserPool();
		controller = new JobQueueController({
			pool,
			onChange: refresh
		});
		const codecs = await listCodecs();
		formats = codecs.map((c) => ({ id: c.id, label: c.label }));
	});

	function refresh(): void {
		if (!controller) return;
		jobs = controller.jobs.slice();
	}

	async function handleFiles(list: FileList): Promise<void> {
		const { files, rejected } = await filesFromList(list);
		const newErrors = rejected.map((r) =>
			r.reason === 'unsupported'
				? t(settings.lang, 'error.unsupported', { name: r.name })
				: t(settings.lang, 'error.tooLarge', { name: r.name })
		);
		if (newErrors.length) errors = [...errors, ...newErrors];
		if (!controller) return;

		const ids = controller.add(files.map((f) => toJobInput(f)));
		for (let i = 0; i < files.length; i++) {
			inputUrls.set(
				ids[i],
				URL.createObjectURL(new Blob([files[i].buffer], { type: files[i].mime }))
			);
		}
	}

	function toJobInput(file: InputFile) {
		return {
			name: file.name,
			mime: file.mime,
			buffer: file.buffer,
			options: toPipelineOptions(settings)
		};
	}

	async function downloadAll(): Promise<void> {
		if (zipping) return;
		const entries = jobs
			.filter((j) => j.status === 'done' && j.result)
			.map((j) => ({ name: j.name, blob: j.result!.blob }));
		if (!entries.length) return;
		zipping = true;
		try {
			const zip = await buildZip(entries);
			const url = URL.createObjectURL(zip);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'pictiur.zip';
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			zipping = false;
		}
	}

	function clearFinished(): void {
		if (!controller) return;
		for (const job of controller.jobs) {
			if (['done', 'error', 'aborted'].includes(job.status)) {
				const url = inputUrls.get(job.id);
				if (url) URL.revokeObjectURL(url);
				inputUrls.delete(job.id);
			}
		}
		controller.clearFinished();
		errors = [];
	}

	function removeJob(id: string): void {
		const url = inputUrls.get(id);
		if (url) URL.revokeObjectURL(url);
		inputUrls.delete(id);
		if (compareJob?.id === id) compareJob = null;
		controller?.removeJob(id);
	}

	// Persistance automatique des réglages (localStorage) — $effect n'existe que dans un composant
	$effect(() => {
		saveSettings(settings);
	});
</script>

<div class="app">
	<header class="topbar">
		<div class="brand">
			<h1 class="sr-only">Pictiúr</h1>
			<img src="/logo/pictiur-wordmark-dark-bg.svg" alt="Pictiúr" class="brand__logo" />
			<span class="brand__badge">{t(settings.lang, 'badge.offline')}</span>
		</div>
		<div class="lang" role="group" aria-label="Langue">
			<button
				type="button"
				class="lang__btn"
				class:active={settings.lang === 'fr'}
				onclick={() => updateSettings({ lang: 'fr' })}
			>
				<Globe size={14} strokeWidth={1.75} aria-hidden="true" />
				FR
			</button>
			<button
				type="button"
				class="lang__btn"
				class:active={settings.lang === 'en'}
				onclick={() => updateSettings({ lang: 'en' })}
			>
				EN
			</button>
		</div>
	</header>

	<main class="main">
		<DropZone onFiles={handleFiles} />

		{#if errors.length}
			<div class="banner" role="status">
				<TriangleAlert size={18} strokeWidth={1.75} aria-hidden="true" class="banner__icon" />
				<div class="banner__body">
					<strong>{t(settings.lang, 'error.ignored', { n: String(errors.length) })}</strong>
					<ul>
						{#each errors as error (error)}
							<li>{error}</li>
						{/each}
					</ul>
				</div>
				<button
					type="button"
					class="btn btn--icon"
					aria-label="Fermer"
					onclick={() => (errors = [])}
				>
					<X size={14} strokeWidth={1.75} aria-hidden="true" />
				</button>
			</div>
		{/if}

		<div class="layout">
			<SettingsPanel {formats} />

			<section class="queue">
				{#if doneCount > 0}
					<div class="actionbar">
						<button type="button" class="btn btn--primary" disabled={zipping} onclick={downloadAll}>
							{#if zipping}
								<LoaderCircle size={15} strokeWidth={1.75} class="spin" aria-hidden="true" />
								{t(settings.lang, 'zip.preparing')}
							{:else}
								<Archive size={15} strokeWidth={1.75} aria-hidden="true" />
								{t(settings.lang, 'result.downloadAll')}
							{/if}
						</button>
						<button type="button" class="btn btn--secondary" onclick={clearFinished}>
							{t(settings.lang, 'queue.clear')}
						</button>
						<small class="count nums">
							{t(settings.lang, 'queue.progressCount', {
								done: String(processedCount),
								total: String(jobs.length)
							})}
						</small>
					</div>
				{/if}

				{#if jobs.length === 0}
					<div class="empty">
						<Image size={48} strokeWidth={1.25} aria-hidden="true" class="empty__icon" />
						<strong>{t(settings.lang, 'queue.emptyTitle')}</strong>
						<small>{t(settings.lang, 'queue.emptySubtitle')}</small>
					</div>
				{:else}
					<div class="grid">
						{#each jobs as job, i (job.id)}
							{#if job.status === 'done' || job.status === 'error' || job.status === 'aborted'}
								<ResultCard
									{job}
									inputUrl={inputUrls.get(job.id) ?? ''}
									onCompare={(j) => (compareJob = j)}
									onRemove={removeJob}
								/>
							{:else}
								<QueueItem {job} position={i + 1} />
							{/if}
						{/each}
					</div>
				{/if}
			</section>
		</div>
	</main>
</div>

{#if compareJob}
	<CompareModal
		job={compareJob}
		inputUrl={inputUrls.get(compareJob.id) ?? ''}
		onClose={() => (compareJob = null)}
	/>
{/if}

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* --- Header sticky --- */
	.topbar {
		position: sticky;
		top: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 14px 32px;
		background: rgba(20, 20, 20, 0.85);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}
	.brand__logo {
		height: 30px;
		width: auto;
		flex: none;
	}
	.brand__badge {
		flex: none;
		font-size: 12px;
		color: var(--text-3);
		border: 1px solid var(--border-input);
		border-radius: var(--r-pill);
		padding: 3px 10px;
		white-space: nowrap;
	}
	.lang {
		display: flex;
		flex: none;
		background: var(--surface);
		border: 1px solid var(--border-input);
		border-radius: var(--r-pill);
		padding: 3px;
		gap: 2px;
	}
	.lang__btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 12px;
		font-weight: 600;
		padding: 5px 12px;
		border-radius: var(--r-pill);
		color: var(--text-3);
		transition:
			background-color var(--dur) var(--ease),
			color var(--dur) var(--ease);
	}
	.lang__btn:hover:not(.active) {
		color: var(--text);
	}
	.lang__btn.active {
		background: var(--accent);
		color: var(--accent-ink);
	}

	/* --- Contenu --- */
	.main {
		width: 100%;
		max-width: 1280px;
		margin: 0 auto;
		padding: 24px 32px 48px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	/* --- Bandeau fichiers rejetés --- */
	.banner {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		background: var(--warn-tint);
		border: 1px solid var(--warn-border);
		border-radius: var(--r-input);
		padding: 12px 16px;
	}
	:global(.banner__icon) {
		flex: none;
		color: var(--warn);
		margin-top: 2px;
	}
	.banner__body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.banner__body strong {
		font-size: 13px;
		font-weight: 600;
		color: var(--warn);
	}
	.banner__body ul {
		margin: 0;
		padding-left: 18px;
		font-size: 12px;
		color: var(--warn-text);
	}

	/* --- Layout settings + file --- */
	.layout {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 24px;
		align-items: start;
	}
	.queue {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	/* --- Barre d'actions --- */
	.actionbar {
		position: sticky;
		top: 64px;
		z-index: 40;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		padding: 10px 14px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--r-card);
		box-shadow: var(--shadow-card);
	}
	.count {
		margin-left: auto;
		font-size: 13px;
		color: var(--text-3);
	}

	/* --- Grille de cartes --- */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 16px;
		align-items: start;
	}

	/* --- État vide --- */
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		text-align: center;
		padding: 80px 24px;
		background: var(--surface-dim);
		border: 1px solid var(--border);
		border-radius: var(--r-card);
	}
	:global(.empty__icon) {
		color: #3a3a3a;
		margin-bottom: 4px;
	}
	.empty strong {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-2);
	}
	.empty small {
		font-size: 14px;
		color: var(--text-3);
	}

	/* --- Responsive --- */
	@media (max-width: 1080px) {
		.layout {
			grid-template-columns: 300px 1fr;
		}
	}
	@media (max-width: 720px) {
		.topbar {
			padding: 12px 16px;
		}
		.main {
			padding: 16px;
			gap: 16px;
		}
		.brand__badge {
			display: none;
		}
		.layout {
			grid-template-columns: 1fr;
		}
		.grid {
			grid-template-columns: 1fr;
		}
		.actionbar {
			position: static;
		}
		.actionbar .btn {
			flex: 1;
		}
	}
</style>
