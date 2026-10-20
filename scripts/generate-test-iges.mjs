/**
 * Installe public/models/test.iges — fixture E16-R2 (cube 10 mm, IGES).
 *
 * Utilise la fixture de référence embarquée dans occt-import-js
 * (test/testfiles/cube-10x10mm/Cube 10x10.igs), celle-là même validée
 * par la suite de tests amont du package (test/test.js, « Format string
 * test » : ReadFile('iges', ...) → success).
 *
 * Pourquoi copier plutôt que générer : la génération manuelle d'IGES
 * (sections 80 colonnes strictes, DE sur 2 lignes, sémantique des
 * entités) est fausse en profondeur — OCCT chargeait 0 entité.
 * Copier la référence garantit un parsing identique à celui testé par
 * le package. Aucun outil CA externe requis.
 *
 * Origine de la référence : https://grabcad.com/library/cube-10x10x10mm-1
 * (redistribuée avec occt-import-js — voir node_modules/occt-import-js/LICENSE.md).
 *
 * Usage : node scripts/generate-test-iges.mjs
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SRC = 'node_modules/occt-import-js/test/testfiles/cube-10x10mm/Cube 10x10.igs';
const OUT = 'public/models/test.iges';

const srcPath = resolve(process.cwd(), SRC);
const outPath = resolve(process.cwd(), OUT);

mkdirSync(dirname(outPath), { recursive: true });
copyFileSync(srcPath, outPath);
console.log(`✔ ${outPath} ← ${SRC}`);
