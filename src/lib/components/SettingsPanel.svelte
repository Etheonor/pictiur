<script lang="ts">
	import { t } from '$lib/i18n';
	import { settings, updateSettings } from '$lib/stores/settings.svelte';

	let { formats }: { formats: { id: string; label: string }[] } = $props();
</script>

<fieldset>
	<legend>{t(settings.lang, 'settings.title')}</legend>

	<label>
		{t(settings.lang, 'settings.format')}
		<select
			value={settings.targetFormat}
			onchange={(e) => updateSettings({ targetFormat: e.currentTarget.value })}
		>
			{#each formats as format (format.id)}
				<option value={format.id}>{format.label}</option>
			{/each}
		</select>
	</label>

	<fieldset>
		<legend>{t(settings.lang, 'settings.compress')}</legend>
		<label>
			<input
				type="radio"
				name="mode"
				checked={settings.compressMode === 'quality'}
				onchange={() => updateSettings({ compressMode: 'quality' })}
			/>
			{t(settings.lang, 'settings.mode.quality')}
		</label>
		<label>
			<input
				type="radio"
				name="mode"
				checked={settings.compressMode === 'weight'}
				onchange={() => updateSettings({ compressMode: 'weight' })}
			/>
			{t(settings.lang, 'settings.mode.weight')}
		</label>
	</fieldset>

	{#if settings.compressMode === 'quality'}
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
