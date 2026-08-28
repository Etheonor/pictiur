// Postbuild : corrige le precache PWA pour que le shell SPA (index.html) se mette
// réellement à jour. vite-plugin-pwa émet l'entrée avec une révision figée
// ("spa-fallback"), or Workbox ne re-télécharge une entrée que si url+revision
// changent → avec une révision constante, l'ancien shell n'est jamais rafraîchi
// et référence des chunks purgés par cleanupOutdatedCaches → page blanche.
//
// On injecte ici un vrai hash du build/index.html produit APRÈS le build.
// À chaque déploiement, ce hash change → Workbox re-précache le nouveau shell.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const swPath = join(root, 'build', 'sw.js');
const shellPath = join(root, 'build', 'index.html');

if (!existsSync(swPath) || !existsSync(shellPath)) {
	console.error('✗ patch-sw : build/sw.js ou build/index.html introuvable.');
	process.exit(1);
}

const shell = readFileSync(shellPath);
const revision = createHash('sha256').update(shell).digest('hex').slice(0, 12);

let sw = readFileSync(swPath, 'utf8');
// {url:"index.html",revision:"..."} — le bundle workbox est minifié sans espaces.
const before = sw;
sw = sw.replace(/(\{url:"index\.html",revision:")[^"]*("\})/, `$1${revision}$2`);

if (sw === before) {
	console.error('✗ patch-sw : entrée index.html non trouvée dans sw.js.');
	process.exit(1);
}

writeFileSync(swPath, sw);
console.log(`✓ patch-sw : precache index.html → revision ${revision}`);
