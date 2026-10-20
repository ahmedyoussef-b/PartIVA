/**
 * Génère public/models/test.iges — cube unitaire ISO IGES 5.3.
 *
 * Fixture E16-R2 : test de parsing IGES via occt-import-js (Web Worker).
 * Reproductible — aucun outil CA externe requis.
 *
 * Usage : node scripts/generate-test-iges.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SIZE = 10; // cube de 10 mm

// ---------- Helpers de formatage IGES (colonnes fixes, 80 car/ligne) ----------

function dirEntry(type, ptr, seq) {
  return (
    String(type).padStart(8) +
    String(ptr).padStart(8) +
    '0'.padStart(8) +
    '0'.padStart(8) +
    '0'.padStart(8) +
    '0'.padStart(8) +
    '0'.padStart(8) +
    '0'.padStart(8) +
    String(seq).padStart(8)
  );
}

function paramLine(params, seq) {
  const body = params.join(',') + ';';
  return body.padEnd(72).slice(0, 72) + String(seq).padStart(8);
}

function flagLine(letter, seq) {
  return ' '.repeat(64) + letter + String(seq).padStart(7);
}

// ---------- Géométrie : cube de SIZE x SIZE x SIZE ----------

const P = [
  [0, 0, 0],
  [SIZE, 0, 0],
  [SIZE, SIZE, 0],
  [0, SIZE, 0],
  [0, 0, SIZE],
  [SIZE, 0, SIZE],
  [SIZE, SIZE, SIZE],
  [0, SIZE, SIZE],
];

const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

// ---------- Construction du fichier IGES ----------

let seq = 0;
const nextSeq = () => ++seq;

const entities = [];

// --- Type 106 : Point (8 sommets) ---
const pointPtrs = [];
for (const p of P) {
  const ptr = nextSeq();
  pointPtrs.push(ptr);
  entities.push({
    type: 106,
    params: [p[0].toString(), p[1].toString(), p[2].toString()],
    dirSeq: nextSeq(),
  });
}

// --- Type 110 : Ligne (12 arêtes) ---
const linePtrs = [];
for (const [a, b] of EDGES) {
  const ptr = nextSeq();
  linePtrs.push(ptr);
  entities.push({
    type: 110,
    params: [pointPtrs[a].toString(), pointPtrs[b].toString()],
    dirSeq: nextSeq(),
  });
}

// --- Type 116 : Surface B-spline planaire (6 faces) ---
const surfacePtrs = [];
for (let f = 0; f < 6; f++) {
  const ptr = nextSeq();
  surfacePtrs.push(ptr);
  entities.push({
    type: 116,
    params: [
      '2',
      '0',
      '0',
      '0',
      '1',
      '1',
      '2',
      '2',
      '0',
      '0',
      ...P[0].map(String),
      ...P[1].map(String),
      ...P[2].map(String),
      ...P[3].map(String),
    ],
    dirSeq: nextSeq(),
  });
}

// --- Type 508 : Face (6 faces) ---
const facePtrs = [];
for (let f = 0; f < 6; f++) {
  const ptr = nextSeq();
  facePtrs.push(ptr);
  entities.push({
    type: 508,
    params: [surfacePtrs[f].toString(), '0', '0', '0'],
    dirSeq: nextSeq(),
  });
}

// --- Type 510 : Shell (1) ---
const shellPtr = nextSeq();
entities.push({
  type: 510,
  params: facePtrs.map(String),
  dirSeq: nextSeq(),
});

// --- Type 514 : Manifold Solid BREP (1) ---
entities.push({
  type: 514,
  params: [shellPtr.toString()],
  dirSeq: nextSeq(),
});

// ---------- Écriture du fichier IGES ----------

const lines = [];

// Section Start
lines.push(flagLine('S', nextSeq()));

// Section Global (minimaliste)
lines.push(flagLine('G', nextSeq()));
lines.push(
  paramLine(
    [
      '1.0E-6',
      '0.0',
      'IN',
      'IN',
      'PRESENT',
      'MILLIMETER',
      'PARTIVA',
      'generate-test-iges.mjs',
      '2026-10-19:00:00.00',
      '2026-10-19:00:00.00',
      '1',
      '0',
    ],
    nextSeq(),
  ),
);

// Section Directory Entry
let dirPtrCounter = 1;
for (const ent of entities) {
  lines.push(dirEntry(ent.type, dirPtrCounter, ent.dirSeq));
  dirPtrCounter++;
}

// Section Parameter Data
let paramPtrCounter = 1;
for (const ent of entities) {
  lines.push(paramLine(ent.params, paramPtrCounter));
  paramPtrCounter++;
}

// Section Terminate
lines.push(flagLine('T', nextSeq()));
lines.push(
  paramLine([entities.length.toString(), entities.length.toString(), '0', '0'], nextSeq()),
);

const content = lines.join('\n') + '\n';

const outPath = resolve(process.cwd(), 'public/models/test.iges');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, content, 'utf8');
console.log(`✔ ${outPath} (${content.length} o, ${entities.length} entités IGES)`);
