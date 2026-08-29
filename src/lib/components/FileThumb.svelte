<script lang="ts">
	let { src, name, size = 56 }: { src: string; name: string; size?: number } = $props();

	const ext = $derived((name.split('.').pop() ?? '').toUpperCase());
	let failed = $state(false);
</script>

<div class="thumb" style="width:{size}px; height:{size}px;" aria-hidden="true">
	{#if failed}
		<span class="thumb__ext">{ext}</span>
	{:else}
		<img {src} alt="" loading="lazy" onerror={() => (failed = true)} />
	{/if}
</div>

<style>
	.thumb {
		flex: none;
		border-radius: 8px;
		background: var(--surface-input);
		border: 1px solid var(--border-input);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.thumb__ext {
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--text-3);
	}
</style>
