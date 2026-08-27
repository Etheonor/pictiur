<script lang="ts">
	import { browser, dev } from '$app/environment';
	import favicon from '$lib/assets/favicon.svg';
	import '@picocss/pico/css/pico.min.css';

	let { children } = $props();

	// Le manifest + le service worker n'existent qu'en build (vite-plugin-pwa) :
	// en dev ils 404 → on ne les référence/enregistre pas.
	if (browser && !dev && 'serviceWorker' in navigator) {
		navigator.serviceWorker.register('/sw.js');
	}
</script>

<svelte:head>
	<title>Pictiúr</title>
	<meta name="description" content="Optimize images 100% locally" />
	<meta name="theme-color" content="#191919" />
	{#if !dev}
		<link rel="manifest" href="/manifest.webmanifest" />
	{/if}
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
