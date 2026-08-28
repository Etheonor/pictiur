// Post-build: fixes the PWA precache so the SPA shell (index.html) actually updates.
// vite-plugin-pwa emits the entry with a fixed revision ("spa-fallback"), but Workbox
// only re-downloads an entry when url+revision change → with a constant revision the
// old shell is never refreshed and references chunks purged by cleanupOutdatedCaches
// → blank page.
//
// We inject a real hash of the build/index.html produced AFTER the build.
// At every deploy this hash changes → Workbox re-precaches the new shell.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const swPath = join(root, 'build', 'sw.js');
const shellPath = join(root, 'build', 'index.html');

if (!existsSync(swPath) || !existsSync(shellPath)) {
	console.error('✗ patch-sw: build/sw.js or build/index.html not found.');
	process.exit(1);
}

const shell = readFileSync(shellPath);
const revision = createHash('sha256').update(shell).digest('hex').slice(0, 12);

let sw = readFileSync(swPath, 'utf8');
// {url:"index.html",revision:"..."} — the workbox bundle is minified without spaces.
const before = sw;
sw = sw.replace(/(\{url:"index\.html",revision:")[^"]*("\})/, `$1${revision}$2`);

if (sw === before) {
	console.error('✗ patch-sw: index.html entry not found in sw.js.');
	process.exit(1);
}

writeFileSync(swPath, sw);
console.log(`✓ patch-sw: precache index.html → revision ${revision}`);
