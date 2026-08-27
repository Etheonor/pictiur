<script lang="ts">
	import { t } from '$lib/i18n';
	import { settings, updateSettings } from '$lib/stores/settings.svelte';

	let { formats }: { formats: { id: string; label: string }[] } = $props();
</script>

<fieldset>
	<legend>{t(settings.lang, 'settings.title')}</legend>

	<label class="row">
		<span>{t(settings.lang, 'settings.format')}</span>
		<select
			value={settings.targetFormat}
			onchange={(e) => updateSettings({ targetFormat: e.currentTarget.value })}
		>
			{#each formats as format (format.id)}
				<option value={format.id}>{format.label}</option>
			{/each}
		</select>
	</label>

	<div class="row">
		<span>{t(settings.lang, 'settings.compress')}</span>
		<div class="radios">
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
		</div>
	</div>

	{#if settings.compressMode === 'quality'}
		<label class="row">
			<span>{t(settings.lang, 'settings.quality')} : {settings.quality}</span>
			<input
				type="range"
				min="1"
				max="100"
				value={settings.quality}
				oninput={(e) => updateSettings({ quality: Number(e.currentTarget.value) })}
			/>
		</label>
	{:else}
		<label class="row">
			<span>{t(settings.lang, 'settings.weightKB')}</span>
			<input
				type="number"
				min="1"
				max="100000"
				value={settings.maxWeightKB}
				onchange={(e) => updateSettings({ maxWeightKB: Number(e.currentTarget.value) })}
			/>
		</label>
	{/if}

	<div class="row">
		<span>{t(settings.lang, 'settings.dimensions')}</span>
		<div class="inline">
			<input
				type="number"
				min="0"
				placeholder="W"
				value={settings.maxWidth || ''}
				onchange={(e) => updateSettings({ maxWidth: Number(e.currentTarget.value) || 0 })}
			/>
			<span>×</span>
			<input
				type="number"
				min="0"
				placeholder="H"
				value={settings.maxHeight || ''}
				onchange={(e) => updateSettings({ maxHeight: Number(e.currentTarget.value) || 0 })}
			/>
		</div>
	</div>

	<label class="row">
		<span>{t(settings.lang, 'settings.fit')}</span>
		<select value={settings.fit} onchange={(e) => updateSettings({ fit: e.currentTarget.value as never })}>
			<option value="contain">{t(settings.lang, 'fit.contain')}</option>
			<option value="cover">{t(settings.lang, 'fit.cover')}</option>
			<option value="fill">{t(settings.lang, 'fit.fill')}</option>
		</select>
	</label>
</fieldset>

<style>
	fieldset {
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 1rem;
		margin: 0;
	}
	legend {
		padding: 0 0.4rem;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		margin: 0.6rem 0;
	}
	.radios {
		display: flex;
		gap: 0.8rem;
		font-size: 0.9rem;
	}
	.inline {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.inline input {
		width: 64px;
	}
	select,
	input[type='number'] {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.3rem 0.5rem;
	}
	input[type='range'] {
		flex: 1;
	}
</style>