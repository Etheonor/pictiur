<script lang="ts">
	let {
		src,
		name,
		size = 56,
		imageStyle,
		fit = 'cover',
		fluid = false
	}: {
		src: string;
		name: string;
		size?: number;
		imageStyle?: string;
		fit?: 'cover' | 'contain';
		fluid?: boolean;
	} = $props();

	const ext = $derived((name.split('.').pop() ?? '').toUpperCase());
	let failed = $state(false);
</script>

<div
	class="thumb"
	class:thumb--fluid={fluid}
	style={fluid ? '' : `width:${size}px; height:${size}px;`}
	aria-hidden="true"
>
	{#if failed}
		<span class="thumb__ext">{ext}</span>
	{:else}
		<img
			{src}
			alt=""
			loading="lazy"
			style={`object-fit: ${fit}; ${imageStyle ?? ''}`}
			onerror={() => (failed = true)}
		/>
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
	.thumb--fluid {
		width: 100%;
		height: 100%;
	}
	.thumb img {
		width: 100%;
		height: 100%;
	}
	.thumb__ext {
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--text-3);
	}
</style>
