<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n';
	import { settings, updateSettings } from '$lib/stores/settings.svelte';

	let { current = 'home' }: { current?: 'home' | 'faq' } = $props();
</script>

<header class="topbar">
	<a href={resolve('/')} class="brand" aria-label="Pictiúr">
		<img src="/logo/pictiur-wordmark-dark-bg.svg" alt="Pictiúr" class="brand__logo" />
		<span class="brand__badge">{t(settings.lang, 'badge.offline')}</span>
	</a>

	<nav class="topbar__nav">
		<a
			href={resolve('/faq')}
			class="navlink"
			class:navlink--active={current === 'faq'}
			aria-current={current === 'faq' ? 'page' : undefined}>{t(settings.lang, 'faq.title')}</a
		>
	</nav>

	<div class="lang" role="group" aria-label="Langue">
		<button
			type="button"
			class="lang__btn"
			class:active={settings.lang === 'fr'}
			onclick={() => updateSettings({ lang: 'fr' })}>FR</button
		>
		<button
			type="button"
			class="lang__btn"
			class:active={settings.lang === 'en'}
			onclick={() => updateSettings({ lang: 'en' })}>EN</button
		>
	</div>
</header>

<style>
	.topbar {
		position: sticky;
		top: 0;
		z-index: 50;
		display: flex;
		align-items: center;
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
		color: inherit;
		text-decoration: none;
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
	.topbar__nav {
		margin-left: auto;
		display: flex;
		gap: 4px;
	}
	.navlink {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-3);
		padding: 6px 12px;
		border-radius: var(--r-pill);
		text-decoration: none;
		transition:
			background-color var(--dur) var(--ease),
			color var(--dur) var(--ease);
	}
	.navlink:hover {
		color: var(--text);
	}
	.navlink--active {
		color: var(--accent);
		background: var(--accent-tint-08);
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

	@media (max-width: 720px) {
		.topbar {
			padding: 12px 16px;
		}
		.brand__badge {
			display: none;
		}
	}
</style>
