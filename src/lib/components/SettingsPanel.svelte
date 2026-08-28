<script lang="ts">
	import { t } from '$lib/i18n';
	import { settings, updateSettings } from '$lib/stores/settings.svelte';

	let { formats }: { formats: { id: string; label: string }[] } = $props();

	const isPng = $derived(settings.targetFormat === 'png');
	const isJxl = $derived(settings.targetFormat === 'jxl');

	function onFormatChange(value: string): void {
		updateSettings({
			targetFormat: value,
			// PNG (lossless) n'a pas de mode budget → on bascule en qualité fixe
			...(value === 'png' && settings.compressMode === 'weight' ? { compressMode: 'quality' } : {})
		});
	}
</script>

<fieldset>
	<legend>{t(settings.lang, 'settings.title')}</legend>

	<label>
		{t(settings.lang, 'settings.format')}
		<select value={settings.targetFormat} onchange={(e) => onFormatChange(e.currentTarget.value)}>
			{#each formats as format (format.id)}
				<option value={format.id}>{format.label}</option>
			{/each}
		</select>
	</label>
	{#if isJxl}
		<small style="color: var(--pico-muted-color);">{t(settings.lang, 'settings.jxlWarning')}</small>
	{/if}

	<fieldset>
		<legend>{t(settings.lang, 'settings.compress')}</legend>
		<label>
			<input
				type="radio"
				name="mode"
				checked={settings.compressMode === 'quality' || isPng}
				onchange={() => updateSettings({ compressMode: 'quality' })}
			/>
			{t(settings.lang, 'settings.mode.quality')}
		</label>
		<label aria-disabled={isPng}>
			<input
				type="radio"
				name="mode"
				checked={settings.compressMode === 'weight' && !isPng}
				disabled={isPng}
				onchange={() => updateSettings({ compressMode: 'weight' })}
			/>
			{t(settings.lang, 'settings.mode.weight')}
		</label>
		{#if isPng}
			<small style="color: var(--pico-muted-color);"
				>{t(settings.lang, 'settings.mode.weightPng')}</small
			>
		{/if}
	</fieldset>

	{#if isPng}
		<small style="color: var(--pico-muted-color);">{t(settings.lang, 'settings.qualityPng')}</small>
	{:else if settings.compressMode === 'quality'}
		<label>
			{t(settings.lang, 'settings.quality')} — {settings.quality}
			<input
				type="range"
				min="1"
				max="100"
				value={settings.quality}
				oninput={(e) => updateSettings({ quality: Number(e.currentTarget.value) })}
			/>
		</label>
	{:else}
		<label>
			{t(settings.lang, 'settings.weightKB')}
			<input
				type="number"
				min="1"
				max="100000"
				value={settings.maxWeightKB}
				onchange={(e) => updateSettings({ maxWeightKB: Number(e.currentTarget.value) })}
			/>
		</label>
	{/if}

	<label>
		{t(settings.lang, 'settings.dimensions')}
		<span style="display:flex; gap:.5rem;">
			<input
				type="number"
				min="0"
				placeholder="W"
				value={settings.maxWidth || ''}
				onchange={(e) => updateSettings({ maxWidth: Number(e.currentTarget.value) || 0 })}
			/>
			<input
				type="number"
				min="0"
				placeholder="H"
				value={settings.maxHeight || ''}
				onchange={(e) => updateSettings({ maxHeight: Number(e.currentTarget.value) || 0 })}
			/>
		</span>
	</label>

	<label>
		{t(settings.lang, 'settings.fit')}
		<select
			value={settings.fit}
			onchange={(e) => updateSettings({ fit: e.currentTarget.value as never })}
		>
			<option value="contain">{t(settings.lang, 'fit.contain')}</option>
			<option value="cover">{t(settings.lang, 'fit.cover')}</option>
			<option value="fill">{t(settings.lang, 'fit.fill')}</option>
		</select>
	</label>
</fieldset>
