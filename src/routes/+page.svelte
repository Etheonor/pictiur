<script lang="ts">
	import { onMount } from 'svelte';
	import DropZone from '$lib/components/DropZone.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import QueueItem from '$lib/components/QueueItem.svelte';
	import ResultCard from '$lib/components/ResultCard.svelte';
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
		const entries = jobs
			.filter((j) => j.status === 'done' && j.result)
			.map((j) => ({ name: j.name, blob: j.result!.blob }));
		if (!entries.length) return;
		const zip = await buildZip(entries);
		const url = URL.createObjectURL(zip);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'pictiur.zip';
		a.click();
		URL.revokeObjectURL(url);
	}

	function clearFinished(): void {
		if (!controller) return;
		for (const job of controller.jobs) {
			const url = inputUrls.get(job.id);
			if (url) URL.revokeObjectURL(url);
		}
		inputUrls.clear();
		controller.clearFinished();
		errors = [];
	}

	// Persistance automatique des réglages (localStorage) — $effect n'existe que dans un composant
	$effect(() => {
		saveSettings(settings);
	});
</script>

<div class="container">
	<header
		style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;"
	>
		<h1 style="margin:0;">Pictiúr</h1>
		<button
			type="button"
			onclick={() => updateSettings({ lang: settings.lang === 'fr' ? 'en' : 'fr' })}
		>
			{settings.lang === 'fr' ? 'EN' : 'FR'}
		</button>
	</header>

	<DropZone onFiles={handleFiles} />

	{#if errors.length}
		<ul>
			{#each errors as error (error)}
				<li>{error}</li>
			{/each}
		</ul>
	{/if}

	<div class="grid" style="margin-top:1.5rem;">
		<aside><SettingsPanel {formats} /></aside>

		<main>
			{#if jobs.some((j) => j.status === 'done' && j.result)}
				<div style="display:flex; gap:.5rem; margin-bottom:1rem;">
					<button type="button" class="primary" onclick={downloadAll}>
						{t(settings.lang, 'result.downloadAll')}
					</button>
					<button type="button" onclick={clearFinished}>{t(settings.lang, 'queue.clear')}</button>
				</div>
			{/if}

			{#if jobs.length === 0}
				<small style="color: var(--pico-muted-color);">{t(settings.lang, 'queue.empty')}</small>
			{:else}
				<div class="grid">
					{#each jobs as job (job.id)}
						{#if job.status === 'done' && job.result}
							<ResultCard {job} inputUrl={inputUrls.get(job.id) ?? ''} />
						{:else}
							<QueueItem {job} />
						{/if}
					{/each}
				</div>
			{/if}
		</main>
	</div>
</div>
