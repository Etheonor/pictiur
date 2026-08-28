import { defineConfig } from '@playwright/test';

// TEMP for Tâche 1.8 (browser codec smoke): the test imports a /src module at
// runtime, which the Vite dev server serves directly. Revert to build+preview
// (4173) once the wasm smoke proof is done (Phase 3).
export default defineConfig({
	// Serial: the wasm-heavy e2e tests navigate and spawn real Workers against
	// the same dev server; parallel runs cause flaky "execution context destroyed".
	fullyParallel: false,
	workers: 1,
	// retry : les e2e WASM lourdes sont sensibles aux machines CI (context destroyed / timeout)
	retries: 1,
	webServer: { command: 'pnpm dev', port: 5173, reuseExistingServer: true },
	use: { baseURL: 'http://localhost:5173' },
	testMatch: ['e2e/**/*.{e2e,spec}.{ts,js}', 'src/**/*.e2e.{ts,js}'],
	// offline.spec.ts exige build+preview (SW réel) → tourne via `pnpm test:offline`
	testIgnore: ['**/offline.spec.ts']
});
