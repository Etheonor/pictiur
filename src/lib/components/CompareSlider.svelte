<script lang="ts">
	let { beforeUrl, afterUrl, alt }: { beforeUrl: string; afterUrl: string; alt: string } =
		$props();
	let pos = $state(50);
</script>

<div class="compare">
	<img src={afterUrl} alt={alt} class="after" />
	<div class="before-wrap" style={`clip-path: inset(0 ${100 - pos}% 0 0);`}>
		<img src={beforeUrl} alt={`${alt} (before)`} class="before" />
	</div>
	<input type="range" min="0" max="100" bind:value={pos} class="slider" aria-label="compare" />
</div>

<style>
	.compare {
		position: relative;
		overflow: hidden;
		border-radius: 8px;
	}
	.compare img {
		display: block;
		width: 100%;
		height: auto;
	}
	.before-wrap {
		position: absolute;
		inset: 0;
	}
	.before {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.slider {
		position: absolute;
		inset: 0;
		width: 100%;
		opacity: 0;
		cursor: ew-resize;
	}
</style>