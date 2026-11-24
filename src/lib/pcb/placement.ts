// Placement automatique de composants PCB.
// Algorithme déterministe (force dirigée + recuit simulé) à partir d'une netlist
// proposée par le LLM. Ne dépend pas du LLM pour les coordonnées : celui-ci ne
// fournit que la topologie (quels composants se connectent).

export interface PlacementComponent {
  reference: string;
  xMm: number;
  yMm: number;
  rotation: number;
  widthMm?: number; // empreinte approximative (largeur)
  heightMm?: number; // empreinte approximative (hauteur)
}

export interface PlacementNet {
  name: string;
  pins: string[]; // "U1.1", "R1.2"
}

export interface PlacementBoard {
  widthMm: number;
  heightMm: number;
  originX?: number;
  originY?: number;
}

// Classification des nets à partir de leur nom. Ces helpers sont volontairement
// indépendants de toute heuristique géométrique : ils serviront de base aux
// pénalités de découplage (à ajouter dans une étape ultérieure).
const POWER_NET_RE = /(^|[_+\s-])(vcc|vdd|vbat|3v3|5v|12v|\+?(?:3|5|12)v\d*)(?:$|[_+\s-])/i;
const GND_NET_RE = /(^|[_+\s-])([a-z]?gnd|vss|ground|0v)(?:$|[_+\s-])/i;

export function isPowerNet(name: string): boolean {
  return POWER_NET_RE.test(name.trim());
}

export function isGndNet(name: string): boolean {
  return GND_NET_RE.test(name.trim());
}

// Map "U1.1" -> nom du net. Une broche peut apparaître dans plusieurs nets
// (erreur de schéma) : la première occurrence gagne, ce qui reste déterministe.
export function buildPinNetMap(nets: PlacementNet[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const net of nets) {
    for (const pin of net.pins) {
      const key = pin.trim();
      if (key && !map.has(key)) map.set(key, net.name);
    }
  }
  return map;
}

function compOfPin(pin: string): string {
  return pin.split('.')[0] ?? pin;
}

function buildAdjacency(
  components: PlacementComponent[],
  nets: PlacementNet[],
): Map<string, Set<string>> {
  const refs = new Set(components.map((c) => c.reference));
  const adj = new Map<string, Set<string>>();
  for (const c of components) adj.set(c.reference, new Set());
  for (const net of nets) {
    const involved = [...new Set(net.pins.map(compOfPin).filter((r) => refs.has(r)))];
    for (let i = 0; i < involved.length; i++) {
      for (let j = i + 1; j < involved.length; j++) {
        adj.get(involved[i]!)!.add(involved[j]!);
        adj.get(involved[j]!)!.add(involved[i]!);
      }
    }
  }
  return adj;
}

function distance(a: PlacementComponent, b: PlacementComponent): number {
  return Math.hypot(a.xMm - b.xMm, a.yMm - b.yMm);
}

function overlapPenalty(a: PlacementComponent, b: PlacementComponent, gap = 5): number {
  const wa = (a.widthMm ?? 8) / 2 + gap;
  const ha = (a.heightMm ?? 6) / 2 + gap;
  const wb = (b.widthMm ?? 8) / 2 + gap;
  const hb = (b.heightMm ?? 6) / 2 + gap;
  const dx = Math.abs(a.xMm - b.xMm);
  const dy = Math.abs(a.yMm - b.yMm);
  if (dx < wa + wb && dy < ha + hb) {
    // pénalité proportionnelle au chevauchement
    return (wa + wb - dx) * (ha + hb - dy);
  }
  return 0;
}

function wireLength(components: PlacementComponent[], adj: Map<string, Set<string>>): number {
  const byRef = new Map(components.map((c) => [c.reference, c]));
  let total = 0;
  for (const [ref, neighbors] of adj) {
    const a = byRef.get(ref)!;
    for (const n of neighbors) {
      const b = byRef.get(n)!;
      total += distance(a, b);
    }
  }
  return total / 2; // chaque arête comptée deux fois
}

export function calculateCost(
  components: PlacementComponent[],
  adj: Map<string, Set<string>>,
  board: PlacementBoard,
): number {
  const ox = board.originX ?? 0;
  const oy = board.originY ?? 0;
  const maxX = ox + board.widthMm;
  const maxY = oy + board.heightMm;

  let c = wireLength(components, adj);
  // chevauchements
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      c += overlapPenalty(components[i]!, components[j]!) * 5;
    }
    // hors plateau
    const comp = components[i]!;
    if (comp.xMm < ox || comp.xMm > maxX || comp.yMm < oy || comp.yMm > maxY) {
      c += 1000;
    }
  }
  return c;
}

function cloneComponents(components: PlacementComponent[]): PlacementComponent[] {
  return components.map((c) => ({ ...c }));
}

// Force dirigée : quelques itérations pour rapprocher les connectés et écarter les autres.
function forceDirected(
  components: PlacementComponent[],
  adj: Map<string, Set<string>>,
  board: PlacementBoard,
  iterations = 40,
): void {
  const ox = board.originX ?? 0;
  const oy = board.originY ?? 0;
  const maxX = ox + board.widthMm;
  const maxY = oy + board.heightMm;
  const byRef = new Map(components.map((c) => [c.reference, c]));

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>();
    for (const c of components) forces.set(c.reference, { fx: 0, fy: 0 });

    // Attraction (ressorts) le long des nets
    for (const [ref, neighbors] of adj) {
      const a = byRef.get(ref)!;
      for (const n of neighbors) {
        const b = byRef.get(n)!;
        const dx = b.xMm - a.xMm;
        const dy = b.yMm - a.yMm;
        const k = 0.05;
        const fx = k * dx;
        const fy = k * dy;
        forces.get(ref)!.fx += fx;
        forces.get(ref)!.fy += fy;
        forces.get(n)!.fx -= fx;
        forces.get(n)!.fy -= fy;
      }
    }

    // Répulsion entre tous les composants
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const a = components[i]!;
        const b = components[j]!;
        const dx = a.xMm - b.xMm;
        const dy = a.yMm - b.yMm;
        const d2 = dx * dx + dy * dy + 1;
        const k = 200 / d2;
        forces.get(a.reference)!.fx += k * dx;
        forces.get(a.reference)!.fy += k * dy;
        forces.get(b.reference)!.fx -= k * dx;
        forces.get(b.reference)!.fy -= k * dy;
      }
    }

    // Application avec amortissement + clamp au plateau
    const damping = 0.5;
    for (const c of components) {
      const f = forces.get(c.reference)!;
      c.xMm = Math.max(ox + 2, Math.min(maxX - 2, c.xMm + f.fx * damping));
      c.yMm = Math.max(oy + 2, Math.min(maxY - 2, c.yMm + f.fy * damping));
    }
  }
}

// Recuit simulé : déplacements/rotations aléatoires pour échapper aux minima locaux.
function simulatedAnnealing(
  components: PlacementComponent[],
  adj: Map<string, Set<string>>,
  board: PlacementBoard,
  iterations = 300,
): void {
  const rng = (seed: number) => {
    // PRNG déterministe (mulberry32) pour reproductibilité
    let t = (seed + 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const ox = board.originX ?? 0;
  const oy = board.originY ?? 0;
  const maxX = ox + board.widthMm;
  const maxY = oy + board.heightMm;

  let best = cloneComponents(components);
  let bestCost = calculateCost(best, adj, board);
  const current = cloneComponents(components);
  let currentCost = calculateCost(current, adj, board);

  for (let i = 0; i < iterations; i++) {
    const t = 1 - i / iterations;
    const temp = 50 * t * t + 1;
    const r = rng(i * 997 + 1);
    const idx = Math.floor(r * current.length);
    const comp = current[idx]!;

    // Sauvegarde de l'état du composant
    const oldX = comp.xMm;
    const oldY = comp.yMm;
    const oldRot = comp.rotation;

    // Mouvement aléatoire
    const moveType = rng(i * 131 + 7);
    if (moveType < 0.6) {
      const dx = (rng(i * 17 + 3) - 0.5) * 20 * t + (rng(i * 31 + 5) - 0.5) * 5;
      const dy = (rng(i * 43 + 11) - 0.5) * 20 * t + (rng(i * 59 + 13) - 0.5) * 5;
      comp.xMm = Math.max(ox + 2, Math.min(maxX - 2, comp.xMm + dx));
      comp.yMm = Math.max(oy + 2, Math.min(maxY - 2, comp.yMm + dy));
    } else if (moveType < 0.85) {
      comp.rotation = [0, 90, 180, 270][Math.floor(rng(i * 71 + 17) * 4)] ?? 0;
    } else {
      // swap avec un autre composant
      const jdx = Math.floor(rng(i * 89 + 19) * current.length);
      if (jdx !== idx) {
        const other = current[jdx]!;
        const tx = comp.xMm,
          ty = comp.yMm,
          tr = comp.rotation;
        comp.xMm = other.xMm;
        comp.yMm = other.yMm;
        comp.rotation = other.rotation;
        other.xMm = tx;
        other.yMm = ty;
        other.rotation = tr;
      }
    }

    const newCost = calculateCost(current, adj, board);
    const delta = newCost - currentCost;
    const accept = delta < 0 || rng(i * 103 + 23) < Math.exp(-delta / temp);

    if (accept) {
      currentCost = newCost;
      if (newCost < bestCost) {
        best = cloneComponents(current);
        bestCost = newCost;
      }
    } else {
      // revert
      comp.xMm = oldX;
      comp.yMm = oldY;
      comp.rotation = oldRot;
    }
  }

  // Appliquer le meilleur résultat
  for (let i = 0; i < components.length; i++) {
    components[i]!.xMm = best[i]!.xMm;
    components[i]!.yMm = best[i]!.yMm;
    components[i]!.rotation = best[i]!.rotation;
  }
}

export function optimizePlacement(
  components: PlacementComponent[],
  nets: PlacementNet[],
  board: PlacementBoard,
): PlacementComponent[] {
  if (components.length === 0) return components;
  const adj = buildAdjacency(components, nets);
  // Force dirigée pour rapprocher les connectés
  forceDirected(components, adj, board, 30);
  // Recuit simulé pour optimiser globalement
  simulatedAnnealing(components, adj, board, 400);
  // Arrondir à la grille 1 mm (KiCad utilise 0.1mm min, 1mm pour l'approx)
  for (const c of components) {
    c.xMm = Math.round(c.xMm * 10) / 10;
    c.yMm = Math.round(c.yMm * 10) / 10;
  }
  return components;
} // Phase C.1 ÔÇö Algorithme de positionnement (pur, testable).
// Convertit des positions canvas (px) en positions carte (mm), avec snapping
// sur la grille KiCad 2.54 mm et g├®n├®ration de r├®f├®rences.

export interface PlacementInput {
  id: string;
  symbolId: string;
  x: number;
  y: number;
  rotation?: number;
}

export interface PlacementContext {
  boardWidthMm: number;
  boardHeightMm: number;
  canvasWidthPx: number;
  canvasHeightPx: number;
  gridMm?: number;
}

export interface PlacementOutput {
  id: string;
  symbolId: string;
  xMm: number;
  yMm: number;
  rotation: number;
  reference: string;
}

const REF_PREFIX: Record<string, string> = {
  resistor: 'R',
  capacitor: 'C',
  inductor: 'L',
  diode: 'D',
  transistor: 'Q',
  ic: 'U',
  mcu: 'U',
  connector: 'J',
  led: 'LED',
  switch: 'SW',
  crystal: 'Y',
  power: 'V',
  other: 'X',
};

const DEFAULT_REF_PREFIX = 'X';

function refPrefix(symbolId: string): string {
  return REF_PREFIX[symbolId] ?? DEFAULT_REF_PREFIX;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function pxToMm(px: number, context: PlacementContext): number {
  if (context.canvasWidthPx === 0) return 0;
  return px * (context.boardWidthMm / context.canvasWidthPx);
}

export function snapToGrid(valueMm: number, gridMm = 2.54): number {
  if (gridMm <= 0) return round2(valueMm);
  return round2(Math.round(valueMm / gridMm) * gridMm);
}

export function generateReference(symbolId: string, existingRefs: string[]): string {
  const prefix = refPrefix(symbolId);
  let max = 0;
  for (const ref of existingRefs) {
    if (!ref.startsWith(prefix)) continue;
    const num = Number.parseInt(ref.slice(prefix.length), 10);
    if (!Number.isNaN(num) && num > max) max = num;
  }
  return `${prefix}${max + 1}`;
}

export function clampToBoard(
  xMm: number,
  yMm: number,
  boardWidthMm: number,
  boardHeightMm: number,
): { xMm: number; yMm: number } {
  return {
    xMm: Math.min(Math.max(xMm, 0), boardWidthMm),
    yMm: Math.min(Math.max(yMm, 0), boardHeightMm),
  };
}

export function computePlacement(
  nodes: PlacementInput[],
  context: PlacementContext,
  existingRefs: string[] = [],
): PlacementOutput[] {
  const gridMm = context.gridMm ?? 2.54;
  const used = [...existingRefs];

  return nodes.map((node) => {
    const reference = generateReference(node.symbolId, used);
    used.push(reference);

    const rawX = snapToGrid(pxToMm(node.x, context), gridMm);
    const rawY = snapToGrid(pxToMm(node.y, context), gridMm);
    const clamped = clampToBoard(rawX, rawY, context.boardWidthMm, context.boardHeightMm);

    return {
      id: node.id,
      symbolId: node.symbolId,
      xMm: clamped.xMm,
      yMm: clamped.yMm,
      rotation: node.rotation ?? 0,
      reference,
    };
  });
}
