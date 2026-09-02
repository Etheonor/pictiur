<script lang="ts">
	import { resolve } from '$app/paths';
	import Header from '$lib/components/Header.svelte';
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings.svelte';

	const QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;
</script>

<svelte:head>
	<title>Pictiúr — FAQ</title>
</svelte:head>

<Header current="faq" />

<main class="faq">
	<div class="faq__inner">
		<h1 class="faq__title">{t(settings.lang, 'faq.title')}</h1>
		<p class="faq__lead">
			{t(settings.lang, 'faq.subtitle')}
		</p>

		<dl class="faq__list">
			{#each QUESTIONS as key (key)}
				<div class="faq__qa">
					<dt class="faq__q">{t(settings.lang, `faq.${key}`)}</dt>
					<dd class="faq__a">{t(settings.lang, `faq.a${key.slice(1)}`)}</dd>
				</div>
			{/each}
		</dl>

		<a href={resolve('/')} class="faq__back">← Pictiúr</a>
	</div>
</main>

<style>
	.faq {
		width: 100%;
		display: flex;
		justify-content: center;
		padding: 48px 24px 96px;
	}
	.faq__inner {
		width: 100%;
		max-width: 760px;
	}
	.faq__title {
		font-size: 32px;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin-bottom: 8px;
	}
	.faq__lead {
		font-size: 16px;
		line-height: 1.6;
		color: var(--text-3);
		margin-bottom: 40px;
	}
	.faq__list {
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}
	.faq__qa {
		padding: 28px 0;
		border-top: 1px solid var(--border);
	}
	.faq__q {
		font-size: 18px;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 10px;
	}
	.faq__a {
		margin: 0;
		font-size: 15px;
		line-height: 1.7;
		color: var(--text-2);
	}
	.faq__back {
		display: inline-block;
		margin-top: 40px;
		font-size: 14px;
		color: var(--text-3);
		text-decoration: none;
	}
	.faq__back:hover {
		color: var(--accent);
	}

	@media (max-width: 720px) {
		.faq {
			padding: 32px 20px 72px;
		}
		.faq__title {
			font-size: 26px;
		}
	}
</style>
