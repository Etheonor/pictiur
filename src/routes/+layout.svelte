<script lang="ts">
	import { browser, dev } from '$app/environment';
	import '../app.css';

	let { children } = $props();

	// The manifest + service worker only exist in build (vite-plugin-pwa):
	// in dev they 404 → not referenced/registered.
	if (browser && !dev && 'serviceWorker' in navigator) {
		navigator.serviceWorker.register('/sw.js');
	}
</script>

<svelte:head>
	<title>Pictiúr</title>
	<meta name="description" content="Optimize images 100% locally" />
	<meta name="theme-color" content="#141414" />
	{#if !dev}
		<link rel="manifest" href="/manifest.webmanifest" />
	{/if}
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</svelte:head>

{@render children()}
