<script lang="ts">
	import { SlidersHorizontal } from '@lucide/svelte';
	import { t } from '$lib/i18n';
	import { settings, updateSettings } from '$lib/stores/settings.svelte';

	let { formats }: { formats: { id: string; label: string }[] } = $props();

	const isPng = $derived(settings.targetFormat === 'png');
	const isJxl = $derived(settings.targetFormat === 'jxl');
	const mode = $derived(isPng ? 'quality' : settings.compressMode);

	function onFormatChange(value: string): void {
		updateSettings({
			targetFormat: value,
			// PNG (lossless) n'a pas de mode budget → on bascule en qualité fixe
			...(value === 'png' && settings.compressMode === 'weight' ? { compressMode: 'quality' } : {})
		});
	}
</script>

<aside class="panel">
	<header class="panel__header">
		<SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
		<h2>{t(settings.lang, 'settings.title')}</h2>
	</header>

	<section class="section">
		<span class="section__label">{t(settings.lang, 'settings.format')}</span>
		<div class="pills" role="radiogroup" aria-label={t(settings.lang, 'settings.format')}>
			{#each formats as format (format.id)}
				<button
					type="button"
					class="pill"
					class:active={settings.targetFormat === format.id}
					role="radio"
					aria-checked={settings.targetFormat === format.id}
					onclick={() => onFormatChange(format.id)}
				>
					{format.label}
				</button>
			{/each}
		</div>
		{#if isJxl}
			<div class="notice notice--warn">{t(settings.lang, 'settings.jxlWarning')}</div>
		{/if}
	</section>

	<section class="section">
		<span class="section__label">{t(settings.lang, 'settings.compress')}</span>
		<div class="radio-cards" role="radiogroup" aria-label={t(settings.lang, 'settings.compress')}>
			<button
				type="button"
				class="radio-card"
				class:active={mode === 'quality'}
				role="radio"
				aria-checked={mode === 'quality'}
				onclick={() => updateSettings({ compressMode: 'quality' })}
			>
				<span class="radio-dot" aria-hidden="true"></span>
				<span class="radio-body">
					<strong>{t(settings.lang, 'settings.mode.quality')}</strong>
					<small>{t(settings.lang, 'settings.mode.qualityDesc')}</small>
				</span>
			</button>
			<button
				type="button"
				class="radio-card"
				class:active={mode === 'weight'}
				class:disabled={isPng}
				role="radio"
				aria-checked={mode === 'weight'}
				aria-disabled={isPng}
				disabled={isPng}
				onclick={() => updateSettings({ compressMode: 'weight' })}
			>
				<span class="radio-dot" aria-hidden="true"></span>
				<span class="radio-body">
					<strong>{t(settings.lang, 'settings.mode.weight')}</strong>
					<small>{t(settings.lang, 'settings.mode.weightDesc')}</small>
				</span>
			</button>
		</div>

		{#if isPng}
			<small class="muted-note">{t(settings.lang, 'settings.qualityPng')}</small>
		{:else if mode === 'quality'}
			<div class="quality-row">
				<label for="quality-range">{t(settings.lang, 'settings.quality')}</label>
				<span class="nums quality-value">{settings.quality}</span>
			</div>
			<input
				id="quality-range"
				class="range"
				type="range"
				min="1"
				max="100"
				value={settings.quality}
				oninput={(e) => updateSettings({ quality: Number(e.currentTarget.value) })}
			/>
		{:else}
			<label class="weight-row">
				<span>{t(settings.lang, 'settings.weightKB')}</span>
				<span class="weight-input">
					<input
						class="input"
						type="number"
						min="1"
						max="100000"
						value={settings.maxWeightKB}
						onchange={(e) => updateSettings({ maxWeightKB: Number(e.currentTarget.value) })}
					/>
					<span class="weight-unit">Ko</span>
				</span>
			</label>
		{/if}
	</section>

	<section class="section">
		<span class="section__label">{t(settings.lang, 'settings.dimensions')}</span>
		<div class="dims-row">
			<input
				class="input"
				type="number"
				min="0"
				placeholder={t(settings.lang, 'settings.dimensions.none')}
				aria-label="W"
				value={settings.maxWidth || ''}
				onchange={(e) => updateSettings({ maxWidth: Number(e.currentTarget.value) || 0 })}
			/>
			<span class="dims-sep">×</span>
			<input
				class="input"
				type="number"
				min="0"
				placeholder={t(settings.lang, 'settings.dimensions.none')}
				aria-label="H"
				value={settings.maxHeight || ''}
				onchange={(e) => updateSettings({ maxHeight: Number(e.currentTarget.value) || 0 })}
			/>
		</div>
		<label class="fit-row">
			<span>{t(settings.lang, 'settings.fit')}</span>
			<select
				class="input"
				value={settings.fit}
				onchange={(e) => updateSettings({ fit: e.currentTarget.value as never })}
			>
				<option value="contain">{t(settings.lang, 'fit.contain')}</option>
				<option value="cover">{t(settings.lang, 'fit.cover')}</option>
				<option value="fill">{t(settings.lang, 'fit.fill')}</option>
			</select>
		</label>
	</section>
</aside>

<style>
	.panel {
		position: sticky;
		top: 76px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--r-card);
		box-shadow: var(--shadow-card);
		padding: 20px;
	}
	.panel__header {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--text);
	}
	.panel__header h2 {
		font-size: 16px;
		font-weight: 600;
	}
	.section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.section__label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-3);
	}

	/* Format pills */
	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.pill {
		font-size: 13px;
		font-weight: 600;
		padding: 7px 13px;
		border-radius: var(--r-pill);
		background: var(--surface-input);
		border: 1px solid var(--border-input);
		color: var(--text-2);
		transition:
			background-color var(--dur) var(--ease),
			border-color var(--dur) var(--ease),
			color var(--dur) var(--ease);
	}
	.pill:hover {
		border-color: var(--border-hover);
		color: var(--text);
	}
	.pill.active {
		background: var(--accent-tint-14);
		border-color: var(--accent);
		color: var(--accent);
	}

	/* Radio-cards */
	.radio-cards {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.radio-card {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 10px 12px;
		border-radius: var(--r-input);
		background: var(--surface-input);
		border: 1px solid var(--border-input);
		text-align: left;
		transition:
			border-color var(--dur) var(--ease),
			background-color var(--dur) var(--ease);
	}
	.radio-card:hover:not(:disabled) {
		border-color: var(--border-hover);
	}
	.radio-card.active {
		border-color: var(--accent);
		background: var(--accent-tint-08);
	}
	.radio-card.disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
	.radio-dot {
		flex: none;
		width: 16px;
		height: 16px;
		margin-top: 2px;
		border-radius: 50%;
		border: 1.5px solid var(--text-4);
		background: transparent;
		transition:
			border-color var(--dur) var(--ease),
			box-shadow var(--dur) var(--ease);
	}
	.radio-card.active .radio-dot {
		border-color: var(--accent);
		box-shadow: inset 0 0 0 4px var(--accent);
	}
	.radio-body {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.radio-body strong {
		font-size: 13px;
		font-weight: 600;
		color: var(--text);
	}
	.radio-body small {
		font-size: 12px;
		color: var(--text-3);
	}

	/* Quality / weight */
	.quality-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}
	.quality-row label {
		font-size: 13px;
		color: var(--text-2);
	}
	.quality-value {
		font-size: 15px;
		font-weight: 700;
		color: var(--accent);
	}
	.weight-row {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 13px;
		color: var(--text-2);
	}
	.weight-input {
		position: relative;
		display: flex;
		align-items: center;
	}
	.weight-input .input {
		padding-right: 38px;
	}
	.weight-unit {
		position: absolute;
		right: 12px;
		font-size: 12px;
		color: var(--text-4);
	}
	.muted-note {
		font-size: 12px;
		color: var(--text-3);
	}

	/* Notices */
	.notice {
		font-size: 12px;
		line-height: 1.45;
		padding: 10px 12px;
		border-radius: var(--r-input);
	}
	.notice--warn {
		background: var(--warn-tint);
		border: 1px solid var(--warn-border);
		color: var(--warn-text);
	}

	/* Dimensions */
	.dims-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.dims-row .input {
		flex: 1;
		min-width: 0;
	}
	.dims-sep {
		color: var(--text-4);
	}
	.fit-row {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 13px;
		color: var(--text-2);
	}

	@media (max-width: 720px) {
		.panel {
			position: static;
		}
	}
</style>
