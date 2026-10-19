/**
 * Synchronise les assets WASM occt-import-js vers public/wasm/.
 *
 * E16-R1 — Option C : les assets sont versionnés dans le repo (build déterministe,
 * licences LGPL-2.1 redistribuées). Ce script permet de re-synchroniser après un
 * bump de la dépendance occt-import-js, sans copie manuelle des binaires.
 *
 * Usage : node scripts/sync-occt-assets.mjs
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = resolve(process.cwd(), 'node_modules/occt-import-js/dist');
const DEST = resolve(process.cwd(), 'public/wasm');

const FILES = [
  'occt-import-js.js',
  'occt-import-js.wasm',
  'occt-import-js-worker.js',
  'license.occt-import-js.txt',
  'license.occt.txt',
];

if (!existsSync(SRC)) {
  console.error(`✖ Source introuvable : ${SRC} (npm install occt-import-js ?)`);
  process.exit(1);
}

if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true });

for (const f of FILES) {
  const from = resolve(SRC, f);
  if (!existsSync(from)) {
    console.error(`✖ Fichier manquant : ${from}`);
    process.exit(1);
  }
  copyFileSync(from, resolve(DEST, f));
  console.log(`✓ ${f}`);
}

console.log(`\n✔ ${FILES.length} assets synchronisés vers public/wasm/`);
