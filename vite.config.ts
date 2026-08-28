import { defineConfig } from 'vitest/config';
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
			includeAssets: ['favicon.svg', 'pictiur-app-icon.svg'],
			manifest: {
				name: 'Pictiúr',
				short_name: 'Pictiúr',
				description: 'Optimize images 100% locally — convert, resize, optimize in one pass.',
				theme_color: '#141414',
				background_color: '#141414',
				display: 'standalone',
				icons: [
					{ src: 'pictiur-app-icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'pictiur-app-icon-512.png', sizes: '512x512', type: 'image/png' },
					{ src: 'pictiur-app-icon.svg', sizes: 'any', type: 'image/svg+xml' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm}'], // ← wasm ajouté
				// Les variantes multithread (_mt) exigent SharedArrayBuffer → headers COOP/COEP,
				// mais @jsquash ne les sélectionne pas automatiquement : code mort pour cette app.
				// On les retire du precache (téléchargées à la demande si jamais utilisées).
				globIgnores: ['**/*_mt*'],
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
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
