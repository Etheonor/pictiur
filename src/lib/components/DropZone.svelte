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

<button
	type="button"
	ondragover={(e) => {
		e.preventDefault();
		dragOver = true;
	}}
	ondragleave={() => (dragOver = false)}
	ondrop={drop}
	onclick={() => inputEl?.click()}
	style={dragOver
		? 'border-style: dashed; border-color: var(--pico-primary-border);'
		: 'border-style: dashed;'}
>
	<input type="file" accept="image/*" multiple hidden bind:this={inputEl} onchange={pick} />
	<strong>{t(settings.lang, 'drop.hint')}</strong><br />
	<small>{t(settings.lang, 'drop.browse')}</small>
</button>
