import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-static SPA: a single shell, everything built client-side.
			adapter: adapter({ fallback: 'index.html' })
		}),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico'],
			manifest: {
				name: 'Pictiúr',
				short_name: 'Pictiúr',
				description: 'Optimize images 100% locally — convert, resize, optimize in one pass.',
				theme_color: '#191919',
				background_color: '#191919',
				display: 'standalone',
				icons: [
					{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm}'], // ← wasm ajouté
				maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // ← 8 Mo (défaut Workbox = 2 Mo)
				navigateFallback: 'index.html', // ← SPA offline
				cleanupOutdatedCaches: true,
				// L'adapter-static écrit build/index.html APRÈS la génération du manifest :
				// on force le fallback SPA dans le precache (servi offline par navigateFallback).
				additionalManifestEntries: [{ url: 'index.html', revision: 'spa-fallback' }]
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
