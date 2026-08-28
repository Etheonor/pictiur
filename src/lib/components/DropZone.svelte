<script lang="ts">
	import { ImageUp } from '@lucide/svelte';
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings.svelte';

	let { onFiles }: { onFiles: (files: FileList) => void } = $props();

	let dragOver = $state(false);
	let inputEl: HTMLInputElement | undefined = $state();

	function pick(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (input.files?.length) onFiles(input.files);
		input.value = ''; // allows re-selecting the same file
	}

	function drop(event: DragEvent): void {
		event.preventDefault();
		dragOver = false;
		if (event.dataTransfer?.files.length) onFiles(event.dataTransfer.files);
	}
</script>

<button
	type="button"
	class="dropzone"
	class:drag-over={dragOver}
	ondragover={(e) => {
		e.preventDefault();
		dragOver = true;
	}}
	ondragleave={() => (dragOver = false)}
	ondrop={drop}
	onclick={() => inputEl?.click()}
	aria-label={t(settings.lang, 'drop.hint')}
>
	<input type="file" accept="image/*" multiple hidden bind:this={inputEl} onchange={pick} />
	<ImageUp class="dropzone__icon" size={40} strokeWidth={1.75} aria-hidden="true" />
	<strong class="dropzone__title">{t(settings.lang, 'drop.hint')}</strong>
	<small class="dropzone__hint">
		{t(settings.lang, 'drop.browse')}
		<span class="dropzone__formats">JPEG · PNG · WebP · GIF · SVG · BMP · AVIF</span>
	</small>
</button>

<style>
	.dropzone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		min-height: 180px;
		width: 100%;
		border: 2px dashed #3a3a3a;
		border-radius: var(--r-dropzone);
		background: #191919;
		padding: 24px;
		cursor: pointer;
		transition:
			border-color var(--dur) var(--ease),
			background-color var(--dur) var(--ease);
	}
	.dropzone:hover {
		border-color: var(--accent);
		background: var(--accent-tint-08);
	}
	.dropzone.drag-over {
		border-color: var(--accent);
		background: var(--accent-tint-08);
	}
	.dropzone:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	:global(.dropzone__icon) {
		color: var(--accent);
	}
	.dropzone__title {
		font-size: 18px;
		font-weight: 600;
		color: var(--text);
	}
	.dropzone__hint {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		font-size: 14px;
		color: var(--text-3);
	}
	.dropzone__formats {
		font-size: 12px;
		color: var(--text-4);
		letter-spacing: 0.02em;
	}
</style>
