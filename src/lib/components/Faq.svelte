<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings.svelte';

	const QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;
</script>

<footer class="faq">
	<details class="faq__root">
		<summary class="faq__summary">
			<ChevronDown size={14} strokeWidth={1.75} class="faq__chev" aria-hidden="true" />
			{t(settings.lang, 'faq.title')}
		</summary>
		<div class="faq__body">
			{#each QUESTIONS as key (key)}
				<details class="faq__item">
					<summary>{t(settings.lang, `faq.${key}`)}</summary>
					<p>{t(settings.lang, `faq.a${key.slice(1)}`)}</p>
				</details>
			{/each}
			<p class="faq__fine">
				Pictiúr · MIT · <a href="https://github.com/Etheonor/pictiur">GitHub</a>
			</p>
		</div>
	</details>
</footer>

<style>
	.faq {
		margin-top: 40px;
		border-top: 1px solid var(--border);
		padding-top: 8px;
		color: var(--text-3);
	}
	.faq__summary {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-3);
		list-style: none;
	}
	.faq__summary::-webkit-details-marker {
		display: none;
	}
	.faq__chev {
		transition: transform var(--dur) var(--ease);
	}
	.faq__root[open] .faq__chev {
		transform: rotate(180deg);
	}
	.faq__body {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px 0;
	}
	.faq__item summary {
		cursor: pointer;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-2);
		padding: 6px 0;
	}
	.faq__item p {
		font-size: 13px;
		line-height: 1.6;
		color: var(--text-3);
		margin: 0 0 8px;
		padding-left: 2px;
	}
	.faq__fine {
		font-size: 12px;
		color: var(--text-4);
		margin-top: 8px;
	}
	.faq__fine a {
		color: var(--text-4);
		text-decoration: underline;
	}
</style>
