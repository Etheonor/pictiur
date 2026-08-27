<script lang="ts">
	let { beforeUrl, afterUrl, alt }: { beforeUrl: string; afterUrl: string; alt: string } = $props();
	let pos = $state(50);
</script>

<div style="position: relative; overflow: hidden; border-radius: 0.5rem;">
	<img src={afterUrl} {alt} style="display:block; width:100%; height:auto;" />
	<div style={`position:absolute; inset:0; clip-path: inset(0 ${100 - pos}% 0 0);`}>
		<img
			src={beforeUrl}
			alt={`${alt} (before)`}
			style="width:100%; height:100%; object-fit:contain;"
		/>
	</div>
	<input
		type="range"
		min="0"
		max="100"
		bind:value={pos}
		style="position:absolute; inset:0; width:100%; opacity:0; cursor:ew-resize;"
		aria-label="compare"
	/>
</div>
