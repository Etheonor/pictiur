// Checks the build structure: AVIF/JXL wasm emitted separately (lazy), reasonable entry.
// Usage: pnpm verify:bundle   (after pnpm build)
// Adapted to the SvelteKit/Rolldown layout: chunks named by hash, wasm under _app/immutable.
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = [join('build', 'client'), 'build'].find((p) => {
	try {
		return statSync(p).isDirectory();
	} catch {
		return false;
	}
});
if (!root) {
	console.error('build/ not found — run `pnpm build` first.');
	process.exit(1);
}

function walk(dir, base = dir) {
	const out = [];
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		const s = statSync(p);
		if (s.isDirectory()) out.push(...walk(p, base));
		else out.push(p);
	}
	return out;
}

const files = walk(root);
const wasm = files.filter((f) => f.endsWith('.wasm'));
// Entry chunk: files under the `entry/` folder
const entries = files.filter((f) => f.split('/').includes('entry') && f.endsWith('.js'));
const entrySize = entries.reduce((n, f) => n + statSync(f).size, 0);
// JS chunks (excluding the dedicated worker)
const mainChunks = files.filter((f) => f.endsWith('.js') && !f.includes('/workers/'));

const failures = [];
// Proof of AVIF/JXL lazy loading: their .wasm exist as separate files
// (loaded on demand, not in the initial bundle).
const hasAvifWasm = wasm.some((f) => f.includes('avif'));
const hasJxlWasm = wasm.some((f) => f.includes('jxl'));
if (!hasAvifWasm) failures.push('avif wasm missing — lazy import broken');
if (!hasJxlWasm) failures.push('jxl wasm missing — lazy import broken');

if (wasm.length === 0) {
	// the glue may have inlined the wasm as base64: acceptable if no giant chunk
	const giant = mainChunks.filter((f) => statSync(f).size > 8 * 1024 * 1024);
	if (giant.length) {
		failures.push('wasm inlined in big chunks: ' + giant.map((f) => relative(root, f)).join(', '));
	} else {
		console.warn('⚠ no .wasm emitted — inline glue accepted (reasonable chunks).');
	}
}
if (entrySize > 600_000) failures.push(`entry chunk too big: ${Math.round(entrySize / 1024)} KB`);

if (failures.length) {
	console.error('✗ BUNDLE', failures.join('\n'));
	process.exit(1);
}
console.log(
	`✓ bundle OK — ${wasm.length} .wasm (avif/jxl separate), entry ${Math.round(entrySize / 1024)} KB`
);
