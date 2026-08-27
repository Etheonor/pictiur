import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	testMatch: /offline\.spec\.ts/,
	timeout: 60_000,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:4173',
		...devices['Desktop Chrome']
	},
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
		reuseExistingServer: true,
		timeout: 120_000
	}
});
