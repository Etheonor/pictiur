<script lang="ts">
	import { browser } from '$app/environment';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();

	if (browser && 'serviceWorker' in navigator) {
		navigator.serviceWorker.register('/sw.js');
	}
</script>

<svelte:head>
	<title>Pictiúr</title>
	<meta name="description" content="Optimize images 100% locally" />
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}