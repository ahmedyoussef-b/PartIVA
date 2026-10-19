/**
 * Génère public/models/test.step — cube unitaire ISO 10303-21 (AP214).
 *
 * Fixture E16-R1 : prototype CadViewer (visualisation STEP via occt-import-js).
 * Reproductible — aucun outil CA externe requis.
 *
 * Usage : node scripts/generate-test-step.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SIZE = 10; // cube de 10 mm (cohérent avec LENGTH_UNIT .MILLI. .METRE.)

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

// Bouilles orientées CCW vu de l'extérieur (règle de la main droite → normale sortante)
const FACES = [
  { loop: [0, 1, 2, 3], normal: [0, 0, -1] }, // bas
  { loop: [4, 5, 6, 7], normal: [0, 0, 1] }, // haut
  { loop: [0, 1, 5, 4], normal: [0, -1, 0] }, // avant
  { loop: [2, 3, 7, 6], normal: [0, 1, 0] }, // arrière
  { loop: [1, 2, 6, 5], normal: [1, 0, 0] }, // droite
  { loop: [0, 4, 7, 3], normal: [-1, 0, 0] }, // gauche
];

const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 3],
  [4, 5],
  [5, 6],
  [6, 7],
  [4, 7],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

const lines = [];
let id = 0;
const next = () => ++id;
const add = (body) => {
  const n = next();
  lines.push(`#${n} = ${body};`);
  return n;
};

const num = (v) => {
  const s = Number.isInteger(v) ? `${v}.` : `${v}`;
  return s;
};
const pt = (p) => `(${num(p[0])},${num(p[1])},${num(p[2])})`;

// --- Contexte produit ---
const appContext = add("APPLICATION_CONTEXT('automotive design')");
add(
  `APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2000,#${appContext})`,
);
const prodContext = add(`PRODUCT_CONTEXT('',#${appContext},'mechanical')`);
const product = add(`PRODUCT('CUBE','CUBE','',(#${prodContext}))`);
const pdf = add(`PRODUCT_DEFINITION_FORMATION('','',#${product})`);
const pdContext = add(`PRODUCT_DEFINITION_CONTEXT('part definition',#${appContext},'design')`);
const pd = add(`PRODUCT_DEFINITION('design','',#${pdf},#${pdContext})`);
const pds = add(`PRODUCT_DEFINITION_SHAPE('','',#${pd})`);
const sdr = add(`SHAPE_DEFINITION_REPRESENTATION(#${pds},#0)`); // remplacé plus bas

// --- Unités ---
const lenUnit = next();
const angUnit = next();
const solUnit = next();
lines.push(
  `#${lenUnit} = ( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) );`,
  `#${angUnit} = ( NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.) );`,
  `#${solUnit} = ( NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT() );`,
);
const uncertainty = add(
  `UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-07),#${lenUnit},'distance_accuracy_value','confusion accuracy')`,
);
const geomContext = add(
  `( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#${uncertainty})) GLOBAL_UNIT_ASSIGNED_CONTEXT((#${lenUnit},#${angUnit},#${solUnit})) REPRESENTATION_CONTEXT('Context','3D') )`,
);

// --- Points + sommets ---
const cartPoints = P.map((p) => add(`CARTESIAN_POINT('',${pt(p)})`));
const vertexPoints = cartPoints.map((cp) => add(`VERTEX_POINT('',#${cp})`));

// --- Axes de placement ---
const globalOrigin = add("CARTESIAN_POINT('',(0.,0.,0.))");
const globalZ = add("DIRECTION('',(0.,0.,1.))");
const globalX = add("DIRECTION('',(1.,0.,0.))");
const globalPlacement = add(
  `AXIS2_PLACEMENT_3D('CUBE_ORIGIN',#${globalOrigin},#${globalZ},#${globalX})`,
);

// --- Arêtes ---
const edgeIds = new Map();
for (const [a, b] of EDGES) {
  const dir = [P[b][0] - P[a][0], P[b][1] - P[a][1], P[b][2] - P[a][2]];
  const linePt = add(`CARTESIAN_POINT('',${pt(P[a])})`);
  const lineDir = add(`DIRECTION('',${pt(dir)})`);
  const vector = add(`VECTOR('',#${lineDir},1.)`);
  const line = add(`LINE('',#${linePt},#${vector})`);
  const edge = add(`EDGE_CURVE('',#${vertexPoints[a]},#${vertexPoints[b]},#${line},.T.)`);
  edgeIds.set(`${Math.min(a, b)}-${Math.max(a, b)}`, { id: edge, from: a, to: b });
}

// --- Faces ---
const faceIds = [];
for (const { loop, normal } of FACES) {
  const oriented = loop.map((v, i) => {
    const w = loop[(i + 1) % loop.length];
    const key = `${Math.min(v, w)}-${Math.max(v, w)}`;
    const edge = edgeIds.get(key);
    const sameSense = edge.from === v ? '.T.' : '.F.';
    return add(`ORIENTED_EDGE('',*,*,#${edge.id},${sameSense})`);
  });
  const edgeLoop = add(`EDGE_LOOP('',(${oriented.map((n) => `#${n}`).join(',')}))`);
  const faceBound = add(`FACE_OUTER_BOUND('',#${edgeLoop},.T.)`);

  const planeOrigin = add(`CARTESIAN_POINT('',${pt(P[loop[0]])})`);
  const planeAxis = add(`DIRECTION('',${pt(normal)})`);
  const refDir = [
    P[loop[1]][0] - P[loop[0]][0],
    P[loop[1]][1] - P[loop[0]][1],
    P[loop[1]][2] - P[loop[0]][2],
  ];
  const planeRef = add(`DIRECTION('',${pt(refDir)})`);
  const placement = add(`AXIS2_PLACEMENT_3D('',#${planeOrigin},#${planeAxis},#${planeRef})`);
  const plane = add(`PLANE('',#${placement})`);
  const face = add(`ADVANCED_FACE('',(#${faceBound}),#${plane},.T.)`);
  faceIds.push(face);
}

const closedShell = add(`CLOSED_SHELL('',(${faceIds.map((n) => `#${n}`).join(',')}))`);
const solid = add(`MANIFOLD_SOLID_BREP('CUBE_BREP',#${closedShell})`);

const absRep = add(
  `ADVANCED_BREP_SHAPE_REPRESENTATION('CUBE',(#${globalPlacement},#${solid}),#${geomContext})`,
);
const sdrId = sdr;
lines[sdrId - 1] = `#${sdrId} = SHAPE_DEFINITION_REPRESENTATION(#${pds},#${absRep});`;

const header = [
  'ISO-10303-21;',
  'HEADER;',
  "FILE_DESCRIPTION(('Minimal unit cube fixture for PartIVA E16-R1 STEP viewer'),'2;1');",
  "FILE_NAME('test.step','2026-10-19T00:00:00',('PartIVA'),('PartIVA E16-R1'),'generate-test-step.mjs','','');",
  "FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));",
  'ENDSEC;',
  'DATA;',
];

const content = `${header.join('\n')}\n${lines.join('\n')}\nENDSEC;\nEND-ISO-10303-21;\n`;

const outPath = resolve(process.cwd(), 'public/models/test.step');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, content, 'utf8');
console.log(`✔ ${outPath} (${content.length} o, ${id} entités STEP)`);
