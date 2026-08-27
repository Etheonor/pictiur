// Vérifie la structure du build : wasm AVIF/JXL émis séparément (lazy), entry raisonnable.
// Usage : pnpm verify:bundle   (après pnpm build)
// Adapté à la structure SvelteKit/Rolldown : chunks nommés par hash, wasm dans _app/immutable.
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
	console.error('build/ introuvable — lance `pnpm build` d abord.');
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
// Chunk d'entrée : fichiers sous le dossier `entry/`
const entries = files.filter((f) => f.split('/').includes('entry') && f.endsWith('.js'));
const entrySize = entries.reduce((n, f) => n + statSync(f).size, 0);
// Chunks JS (hors worker dédié)
const mainChunks = files.filter(
	(f) => f.endsWith('.js') && !f.includes('/workers/')
);

const failures = [];
// Preuve du lazy loading AVIF/JXL : leurs .wasm existent en fichiers séparés
// (chargés à la demande, pas dans le bundle initial).
const hasAvifWasm = wasm.some((f) => f.includes('avif'));
const hasJxlWasm = wasm.some((f) => f.includes('jxl'));
if (!hasAvifWasm) failures.push('wasm avif manquant — lazy import cassé');
if (!hasJxlWasm) failures.push('wasm jxl manquant — lazy import cassé');

if (wasm.length === 0) {
	// le glue a pu inliner les wasm en base64 : acceptable si aucun chunk géant
	const giant = mainChunks.filter((f) => statSync(f).size > 8 * 1024 * 1024);
	if (giant.length) {
		failures.push(
			'wasm inlinés dans de gros chunks : ' + giant.map((f) => relative(root, f)).join(', ')
		);
	} else {
		console.warn('⚠ aucun .wasm émis — glue inline accepté (chunks raisonnables).');
	}
}
if (entrySize > 600_000) failures.push(`entry chunk trop grosse : ${Math.round(entrySize / 1024)} Ko`);

if (failures.length) {
	console.error('✗ BUNDLE', failures.join('\n'));
	process.exit(1);
}
console.log(
	`✓ bundle OK — ${wasm.length} .wasm (avif/jxl séparés), entry ${Math.round(entrySize / 1024)} Ko`
);