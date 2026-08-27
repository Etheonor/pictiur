<script lang="ts">
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings.svelte';

	let { onFiles }: { onFiles: (files: FileList) => void } = $props();

	let dragOver = $state(false);
	let inputEl: HTMLInputElement | undefined = $state();

	function pick(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (input.files?.length) onFiles(input.files);
		input.value = ''; // permet de re-sélectionner le même fichier
	}

	function drop(event: DragEvent): void {
		event.preventDefault();
		dragOver = false;
		if (event.dataTransfer?.files.length) onFiles(event.dataTransfer.files);
	}
</script>

<div
	class="dropzone"
	class:active={dragOver}
	ondragover={(e) => {
		e.preventDefault();
		dragOver = true;
	}}
	ondragleave={() => (dragOver = false)}
	ondrop={drop}
	onclick={() => inputEl?.click()}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			inputEl?.click();
		}
	}}
	role="button"
	tabindex="0"
>
	<input type="file" accept="image/*" multiple class="hidden" bind:this={inputEl} onchange={pick} />
	<p class="hint">{t(settings.lang, 'drop.hint')}</p>
	<span class="browse">{t(settings.lang, 'drop.browse')}</span>
</div>

<style>
	.dropzone {
		border: 2px dashed var(--border);
		border-radius: 12px;
		padding: 3rem 1rem;
		text-align: center;
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
	}
	.dropzone.active,
	.dropzone:hover {
		border-color: var(--accent);
		background: var(--surface-2);
	}
	.hidden {
		display: none;
	}
	.hint {
		margin: 0 0 0.5rem;
		font-weight: 600;
	}
	.browse {
		opacity: 0.7;
		font-size: 0.9rem;
	}
</style>