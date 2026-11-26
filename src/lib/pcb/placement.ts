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
  /** Rôle fonctionnel déduit du CDC (voir inferPlacementRole). */
  role?: PlacementRole;
  /** Texte libre (value/type/rationale/footprint) utilisé par les règles métier. */
  hints?: string;
  /** Composant verrouillé par la passe séquentielle (connecteurs). */
  locked?: boolean;
  /** Ancrage et amplitude de déplacement autorisée pendant le recuit (ICs). */
  anchorX?: number;
  anchorY?: number;
  movementRangeMm?: number;
}

export type PlacementRole =
  'regulator' | 'mcu' | 'clock' | 'serial' | 'connector' | 'capacitor' | 'sensitive';

export interface PlacementHints {
  reference: string;
  value?: string | null;
  type?: string | null;
  footprint?: string | null;
  rationale?: string | null;
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
const POWER_NET_RE = /(^|[_+\s-])(vcc|vdd|vbat|3v3|5v|12v|24v|\+?(?:3|5|12|24)v\d*)(?:$|[_+\s-])/i;
const GND_NET_RE = /(^|[_+\s-])([a-z]?gnd|vss|ground|0v)(?:$|[_+\s-])/i;

export function isPowerNet(name: string): boolean {
  return POWER_NET_RE.test(name.trim());
}

export function isGndNet(name: string): boolean {
  return GND_NET_RE.test(name.trim());
}

// Map "U1.1" -> nom du net. Une broche peut apparaître dans plusieurs nets
// (erreur de schéma) : la première occurrence gagne, ce qui reste déterministe.
/**
 * Déduit un rôle fonctionnel des métadonnées fournies par le LLM. Les motifs
 * sont volontairement larges (le CDC utilise « RS‑485 » avec tirets spéciaux,
 * « Régulateur DC-DC », « STM32F405 », etc.).
 */
export function inferPlacementRole(input: PlacementHints): PlacementRole | undefined {
  const ref = input.reference.trim().toUpperCase();
  const text = [input.value, input.type, input.footprint, input.rationale]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/^J|^P|^CN/.test(ref) || /connecteur|connector|db9|terminalblock|pinheader/i.test(text)) {
    return 'connector';
  }
  if (/oscill|cristal|crystal|quartz|horloge|clock/i.test(text) || /^Y|^X/.test(ref)) {
    return 'clock';
  }
  // MCU AVANT serial : la rationale d'un MCU mentionne souvent « UART ».
  if (/microcontr|mcu|stm32|esp32|atmega|lqfp|qfn/i.test(text)) return 'mcu';
  // Le NE555 (et ses dérivés) est le IC principal d'un clignotant LED.
  if (/\bne?555\b|\b555\b|timer ic|timer.*555/i.test(text)) return 'mcu';
  if (/rs.?485|modbus|transceiver|sn75176/i.test(text)) return 'serial';
  if (/r[eé]gulateur|regulator|dc.?dc|buck|to-220/i.test(text)) return 'regulator';
  if (/^C/.test(ref) || /condensateur|capacitor|d[eé]couplage/i.test(text)) return 'capacitor';
  if (/capteur|sensor|analog|0.?10\s*v|temp[eé]rature|pt100|thermocouple|adc/i.test(text)) {
    return 'sensitive';
  }
  return undefined;
}

/** Texte normalisé à conserver dans `hints` pour les règles de voisinage. */
export function buildHints(input: PlacementHints): string {
  return [input.value, input.type, input.footprint, input.rationale]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function overlapPenalty(a: PlacementComponent, b: PlacementComponent, gap = 0): number {
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

// Congestion : même sans chevauchement, deux composants trop proches ne
// laissent pas de place au routage. On mesure l'écart entre les bords des
// bounding boxes (distance de Chebyshev), pas entre les centres.
function congestionPenalty(
  a: PlacementComponent,
  b: PlacementComponent,
  minClearance = 2,
  weight = 10,
): number {
  const halfWa = (a.widthMm ?? 10) / 2;
  const halfHa = (a.heightMm ?? 10) / 2;
  const halfWb = (b.widthMm ?? 10) / 2;
  const halfHb = (b.heightMm ?? 10) / 2;
  const edgeX = Math.abs(a.xMm - b.xMm) - (halfWa + halfWb);
  const edgeY = Math.abs(a.yMm - b.yMm) - (halfHa + halfHb);
  const gap = Math.max(edgeX, edgeY);
  if (gap >= minClearance) return 0;
  const deficit = minClearance - Math.max(gap, 0);
  return weight * deficit * deficit;
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

// Densité globale : on évite que plusieurs composants se partagent la même
// cellule, même sans chevauchement, pour réserver des canaux de routage.
const GRID_COLS = 10;
const GRID_ROWS = 10;
const DENSITY_THRESHOLD = 3;
const DENSITY_WEIGHT = 30;

function densityPenalty(components: PlacementComponent[], board: PlacementBoard): number {
  const ox = board.originX ?? 0;
  const oy = board.originY ?? 0;
  const cellWidth = board.widthMm / GRID_COLS;
  const cellHeight = board.heightMm / GRID_ROWS;
  if (cellWidth <= 0 || cellHeight <= 0) return 0;

  const density: number[][] = Array.from({ length: GRID_COLS }, () =>
    Array.from({ length: GRID_ROWS }, () => 0),
  );
  for (const comp of components) {
    const col = Math.min(GRID_COLS - 1, Math.max(0, Math.floor((comp.xMm - ox) / cellWidth)));
    const row = Math.min(GRID_ROWS - 1, Math.max(0, Math.floor((comp.yMm - oy) / cellHeight)));
    density[col]![row]! += 1;
  }

  let penalty = 0;
  for (const column of density) {
    for (const count of column) {
      if (count > DENSITY_THRESHOLD) {
        penalty += DENSITY_WEIGHT * (count - DENSITY_THRESHOLD) ** 2;
      }
    }
  }
  return penalty;
}

// Orientation par flux de signal (Étape 5 roadmap).
const CRITICAL_NET_RE = /(osc_in|osc_out|\bclk\b|clock|xtal|vcc|vdd|3v3|5v|rs485|uart|spi|i2c)/i;
const ROTATION_WEIGHT = 20;

function idealSignalRotation(
  net: PlacementNet,
  byRef: Map<string, PlacementComponent>,
): number | null {
  const refs = [...new Set(net.pins.map((p) => p.split('.')[0] ?? p))].filter((r) => byRef.has(r));
  if (refs.length < 2) return null;
  const first = byRef.get(refs[0]!)!;
  const last = byRef.get(refs[refs.length - 1]!)!;
  const angle = (Math.atan2(last.yMm - first.yMm, last.xMm - first.xMm) * 180) / Math.PI;
  return (((Math.round(angle / 90) * 90) % 180) + 180) % 180;
}

function signalRotationPenalty(components: PlacementComponent[], nets: PlacementNet[]): number {
  if (nets.length === 0) return 0;
  const byRef = new Map(components.map((c) => [c.reference, c]));
  let penalty = 0;
  for (const net of nets) {
    if (!CRITICAL_NET_RE.test(net.name)) continue;
    const ideal = idealSignalRotation(net, byRef);
    if (ideal === null) continue;
    for (const comp of components) {
      if (!net.pins.some((p) => p.split('.')[0] === comp.reference)) continue;
      const current = ((comp.rotation % 180) + 180) % 180;
      const delta = Math.abs(current - ideal);
      const perpendicular = Math.min(delta, 180 - delta);
      if (perpendicular > 45) penalty += ROTATION_WEIGHT * perpendicular;
    }
  }
  return penalty;
}

export function calculateCost(
  components: PlacementComponent[],
  adj: Map<string, Set<string>>,
  board: PlacementBoard,
  nets: PlacementNet[] = [],
): number {
  const ox = board.originX ?? 0;
  const oy = board.originY ?? 0;
  const maxX = ox + board.widthMm;
  const maxY = oy + board.heightMm;

  let c = wireLength(components, adj);

  // --- Règles métier issues du CDC (24V->5V, Modbus RTU, sortie 0-10V) ---
  const CLOCK_TARGET_MM = 5;
  const CLOCK_WEIGHT = 80;
  const THERMAL_MIN_MM = 20;
  const THERMAL_WEIGHT = 50;
  const REG_INPUT_TARGET_MM = 8;
  const REG_INPUT_WEIGHT = 60;
  const SERIAL_TARGET_MM = 8;
  const SERIAL_WEIGHT = 50;
  const EDGE_TOP_TARGET_MM = 3;
  const EDGE_TOP_WEIGHT = 600;

  const withRole = (role: PlacementRole) => components.filter((x) => x.role === role);
  const penalize = (
    groupA: PlacementComponent[],
    groupB: PlacementComponent[],
    target: number,
    weight: number,
    mode: 'toward' | 'away',
  ): void => {
    for (const a of groupA) {
      for (const b of groupB) {
        if (a === b) continue;
        const d = distance(a, b);
        const excess = mode === 'toward' ? Math.max(0, d - target) : Math.max(0, target - d);
        c += weight * excess * excess;
      }
    }
  };

  const clocks = withRole('clock');
  const mcus = withRole('mcu');
  const regulators = withRole('regulator');
  const serials = withRole('serial');
  const connectors = withRole('connector');
  const sensitive = [...mcus, ...withRole('sensitive'), ...clocks];

  // 1. Oscillateur collé au MCU.
  if (clocks.length > 0 && mcus.length > 0) {
    penalize(clocks, mcus, CLOCK_TARGET_MM, CLOCK_WEIGHT, 'toward');
  }
  // 1b. Découplage / résistances de support collés à leur IC principal.
  const mainIcs = [...mcus, ...regulators, ...serials];
  const supportPassives = components.filter(
    (c) => c.role === 'capacitor' || /^R/i.test(c.reference),
  );
  if (mainIcs.length > 0 && supportPassives.length > 0) {
    penalize(supportPassives, mainIcs, 5, 40, 'toward');
  }
  // 2. Régulateur (chaud) éloigné des parties sensibles.
  if (regulators.length > 0 && sensitive.length > 0) {
    penalize(regulators, sensitive, THERMAL_MIN_MM, THERMAL_WEIGHT, 'away');
  }
  // Régulateur près de son connecteur d'entrée 24 V.
  if (regulators.length > 0 && connectors.length > 0) {
    const inputConnectors = connectors.filter((x) =>
      /alim|power|24\s*v|vin|entr[eé]e/.test(x.hints ?? ''),
    );
    penalize(
      regulators,
      inputConnectors.length > 0 ? inputConnectors : connectors.slice(0, 1),
      REG_INPUT_TARGET_MM,
      REG_INPUT_WEIGHT,
      'toward',
    );
  }
  // 3. Transceiver RS-485 près de son connecteur.
  if (serials.length > 0 && connectors.length > 0) {
    const serialConnectors = connectors.filter((x) => /rs.?485|modbus|db9/.test(x.hints ?? ''));
    penalize(
      serials,
      serialConnectors.length > 0 ? serialConnectors : connectors.slice(0, 1),
      SERIAL_TARGET_MM,
      SERIAL_WEIGHT,
      'toward',
    );
  }
  // 4. Connecteurs sur le bord supérieur (contrainte explicite du CDC).
  // `oy` est l'origine réelle du plateau : pas besoin de supposer Y=0.
  for (const conn of connectors) {
    const dTop = conn.yMm - oy;
    c += EDGE_TOP_WEIGHT * Math.max(0, dTop - EDGE_TOP_TARGET_MM) ** 2;
  }

  // chevauchements
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const a = components[i]!;
      const b = components[j]!;
      // Chevauchement réel (pénalité forte) + congestion (place pour les pistes).
      c += overlapPenalty(a, b) * 100;
      c += congestionPenalty(a, b);
    }
    // hors plateau
    const comp = components[i]!;
    if (comp.xMm < ox || comp.xMm > maxX || comp.yMm < oy || comp.yMm > maxY) {
      c += 1000;
    }
  }
  // Densité globale (canaux de routage réservés entre les blocs).
  c += densityPenalty(components, board);
  // Alignement avec l'axe des nets critiques.
  c += signalRotationPenalty(components, nets);
  return c;
}

function cloneComponents(components: PlacementComponent[]): PlacementComponent[] {
  return components.map((c) => ({ ...c }));
}

// Passe séquentielle par blocs fonctionnels (Étape 2 roadmap).
// Ordre : connecteurs verrouillés sur les bords → ICs au centre → passifs
// attachés à leur IC → secondaires dans les espaces libres.
export function placeSequentially(
  components: PlacementComponent[],
  nets: PlacementNet[],
  board: PlacementBoard,
): void {
  // Sans rôles connus, on ne force rien : le recuit gère le placement initial.
  if (!components.some((c) => c.role)) return;

  const ox = board.originX ?? 0;
  const oy = board.originY ?? 0;
  const maxX = ox + board.widthMm;
  const maxY = oy + board.heightMm;
  const byRef = new Map(components.map((c) => [c.reference, c]));
  const adj = buildAdjacency(components, nets);

  // 1. Connecteurs : bord supérieur, répartis sur X, verrouillés.
  const connectors = components
    .filter((c) => c.role === 'connector')
    .sort((a, b) => a.reference.localeCompare(b.reference));
  connectors.forEach((conn, index) => {
    conn.xMm = ox + ((index + 1) / (connectors.length + 1)) * board.widthMm;
    conn.yMm = oy + 3;
    conn.rotation = 0;
    conn.locked = true;
  });

  // 2. ICs principaux : zone centrale, espacement >= 5 mm, déplacement ±2 mm.
  const ics = components.filter(
    (c) =>
      (c.role === 'mcu' || c.role === 'regulator' || c.role === 'serial' || c.role === 'clock') &&
      !c.locked,
  );
  if (ics.length > 0) {
    const cols = Math.ceil(Math.sqrt(ics.length));
    const rows = Math.ceil(ics.length / cols);
    const spacing = 8;
    ics.forEach((ic, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      ic.xMm = clamp(ox + board.widthMm / 2 + (col - (cols - 1) / 2) * spacing, ox + 2, maxX - 2);
      ic.yMm = clamp(oy + board.heightMm / 2 + (row - (rows - 1) / 2) * spacing, oy + 2, maxY - 2);
      ic.rotation = 0;
      ic.anchorX = ic.xMm;
      ic.anchorY = ic.yMm;
      ic.movementRangeMm = 2;
    });
  }

  // 3. Passifs attachés à leur IC via un net, à ~5 mm, angle réparti (doré).
  const icsRefs = new Set(ics.map((c) => c.reference));
  const passives = components.filter(
    (c) => !c.locked && (c.role === 'capacitor' || /^R/i.test(c.reference)),
  );
  passives.forEach((passive, index) => {
    const parentRef = [...(adj.get(passive.reference) ?? [])].find((r) => icsRefs.has(r));
    const parent = parentRef ? byRef.get(parentRef) : undefined;
    if (!parent) return;
    const angle = (index * 137.5 * Math.PI) / 180;
    passive.xMm = clamp(parent.xMm + 5 * Math.cos(angle), ox + 2, maxX - 2);
    passive.yMm = clamp(parent.yMm + 5 * Math.sin(angle), oy + 2, maxY - 2);
  });

  // 4. Secondaires : répartis dans la partie basse, en évitant les connecteurs.
  const placedRefs = new Set([...connectors, ...ics, ...passives].map((c) => c.reference));
  const secondaries = components.filter((c) => !placedRefs.has(c.reference));
  secondaries.forEach((secondary, index) => {
    secondary.xMm = clamp(
      ox + ((index + 1) / (secondaries.length + 1)) * board.widthMm,
      ox + 2,
      maxX - 2,
    );
    secondary.yMm = clamp(oy + board.heightMm - 8, oy + 2, maxY - 2);
  });
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
      if (c.locked) continue;
      const f = forces.get(c.reference)!;
      c.xMm = Math.max(ox + 2, Math.min(maxX - 2, c.xMm + f.fx * damping));
      c.yMm = Math.max(oy + 2, Math.min(maxY - 2, c.yMm + f.fy * damping));
      if (c.anchorX !== undefined && c.anchorY !== undefined && c.movementRangeMm !== undefined) {
        c.xMm = clamp(c.xMm, c.anchorX - c.movementRangeMm, c.anchorX + c.movementRangeMm);
        c.yMm = clamp(c.yMm, c.anchorY - c.movementRangeMm, c.anchorY + c.movementRangeMm);
      }
    }
  }
}

// Proposition de déplacement dirigé par les rôles métier. Le recuit garde le
// critère d'acceptation : un déplacement guidé qui augmente le coût peut être
// rejeté, ce qui évite de forcer une contrainte au détriment des autres.
function guidedPosition(
  comp: PlacementComponent,
  current: PlacementComponent[],
  board: PlacementBoard,
  oy: number,
  r: number,
): { x: number; y: number } | null {
  const jitter = (r - 0.5) * 3;
  // Décalage hors du composant cible : un déplacement guidé « dans le cœur »
  // d'un MCU/connecteur est rejeté par la pénalité de chevauchement.
  const offset = (anchor: PlacementComponent): [number, number] => [
    (anchor.widthMm ?? 8) / 2 + (comp.widthMm ?? 8) / 2 + 1.5,
    (anchor.heightMm ?? 6) / 2 + (comp.heightMm ?? 6) / 2 + 1.5,
  ];
  if (comp.role === 'connector') {
    // Répartir les connecteurs le long du bord supérieur : sans cela ils se
    // empilent au même x et le recuit rejette tout déplacement (chevauchement).
    const connectors = current
      .filter((c) => c.role === 'connector')
      .sort((a, b) => a.reference.localeCompare(b.reference));
    const index = connectors.findIndex((c) => c.reference === comp.reference);
    const ox = board.originX ?? 0;
    const spreadX = ox + ((index + 1) / (connectors.length + 1)) * board.widthMm;
    return { x: spreadX + jitter, y: oy + 3 + jitter / 2 };
  }
  if (comp.role === 'clock') {
    const mcu = current.find((c) => c.role === 'mcu');
    if (mcu) {
      const [dx, dy] = offset(mcu);
      const sx = r < 0.5 ? -1 : 1;
      const sy = r < 0.25 || r > 0.75 ? -1 : 1;
      return { x: mcu.xMm + sx * dx + jitter, y: mcu.yMm + sy * dy + jitter };
    }
  }
  if (comp.role === 'regulator') {
    const input = current.find(
      (c) => c.role === 'connector' && /alim|power|24\s*v|vin|entr[eé]e/.test(c.hints ?? ''),
    );
    if (input) {
      const [dx] = offset(input);
      return { x: input.xMm + dx + jitter, y: input.yMm + jitter };
    }
  }
  if (comp.role === 'serial') {
    const conn = current.find(
      (c) => c.role === 'connector' && /rs.?485|modbus|db9/.test(c.hints ?? ''),
    );
    if (conn) {
      const [dx] = offset(conn);
      return { x: conn.xMm - dx + jitter, y: conn.yMm + jitter };
    }
  }
  return null;
}

// Recuit simulé : déplacements/rotations aléatoires pour échapper aux minima locaux.
function simulatedAnnealing(
  components: PlacementComponent[],
  adj: Map<string, Set<string>>,
  board: PlacementBoard,
  nets: PlacementNet[],
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
  let bestCost = calculateCost(best, adj, board, nets);
  const current = cloneComponents(components);
  let currentCost = calculateCost(current, adj, board, nets);

  for (let i = 0; i < iterations; i++) {
    const t = 1 - i / iterations;
    const temp = 50 * t * t + 1;
    const r = rng(i * 997 + 1);
    const idx = Math.floor(r * current.length);
    const comp = current[idx]!;

    // Les composants verrouillés (connecteurs) ne bougent jamais pendant le recuit.
    if (comp.locked) continue;

    // Sauvegarde de l'état du composant
    const oldX = comp.xMm;
    const oldY = comp.yMm;
    const oldRot = comp.rotation;

    // Mouvement aléatoire
    const moveType = rng(i * 131 + 7);
    if (moveType < 0.6) {
      const dx = (rng(i * 17 + 3) - 0.5) * 20 * t + (rng(i * 31 + 5) - 0.5) * 5;
      const dy = (rng(i * 43 + 11) - 0.5) * 20 * t + (rng(i * 59 + 13) - 0.5) * 5;
      const guided = guidedPosition(comp, current, board, oy, r);
      const targetX = guided ? guided.x : comp.xMm + dx;
      const targetY = guided ? guided.y : comp.yMm + dy;
      comp.xMm = Math.max(ox + 2, Math.min(maxX - 2, targetX));
      // Contrainte physique : un connecteur reste sur le bord supérieur.
      // Seul X est libre, pour lui permettre de s'écarter des voisins.
      comp.yMm = comp.role === 'connector' ? oy + 3 : Math.max(oy + 2, Math.min(maxY - 2, targetY));
    } else if (moveType < 0.85) {
      if (comp.role !== 'connector') {
        comp.rotation = [0, 90, 180, 270][Math.floor(rng(i * 71 + 17) * 4)] ?? 0;
      }
    } else {
      // swap avec un autre composant
      const jdx = Math.floor(rng(i * 89 + 19) * current.length);
      // Un swap déplacerait un connecteur en Y : on l'interdit.
      if (jdx !== idx && comp.role !== 'connector' && current[jdx]!.role !== 'connector') {
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

    // Les ICs ancrés ne peuvent pas s'éloigner de plus de movementRangeMm.
    for (const anchored of [comp, current[Math.floor(r * current.length)]!]) {
      if (
        anchored.movementRangeMm !== undefined &&
        anchored.anchorX !== undefined &&
        anchored.anchorY !== undefined
      ) {
        const range = anchored.movementRangeMm;
        anchored.xMm = clamp(
          anchored.xMm,
          Math.max(ox + 2, anchored.anchorX - range),
          Math.min(maxX - 2, anchored.anchorX + range),
        );
        anchored.yMm = clamp(
          anchored.yMm,
          Math.max(oy + 2, anchored.anchorY - range),
          Math.min(maxY - 2, anchored.anchorY + range),
        );
      }
    }

    const newCost = calculateCost(current, adj, board, nets);
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

/**
 * Phase 2 — orientations logiques et reproductibles. Les composants dont le
 * rôle est connu sont alignés à 0° ; les autres gardent leur orientation
 * (le recuit reste libre d'optimiser leur rotation).
 */
export function optimizeRotations(
  components: PlacementComponent[],
  nets: PlacementNet[] = [],
): PlacementComponent[] {
  const byRef = new Map(components.map((c) => [c.reference, c]));
  for (const c of components) {
    if (
      c.role === 'connector' ||
      c.role === 'regulator' ||
      c.role === 'capacitor' ||
      c.role === 'mcu' ||
      c.role === 'clock' ||
      c.role === 'serial'
    ) {
      // Alignement sur l'axe du net critique le plus proche, sinon 0°.
      let ideal: number | null = null;
      for (const net of nets) {
        if (!CRITICAL_NET_RE.test(net.name)) continue;
        if (!net.pins.some((p) => p.split('.')[0] === c.reference)) continue;
        ideal = idealSignalRotation(net, byRef);
        if (ideal !== null) break;
      }
      c.rotation = ideal ?? 0;
    }
  }
  return components;
}

// Réparation détermin finale : garantir zéro chevauchement de bounding boxes.
// Les pénalités du coût poussent dans la bonne direction mais peuvent laisser
// une paire se chevaucher ; on écarte alors la paire le long de l'axe le moins
// coûteux. Les connecteurs ne bougent qu'en X (bord supérieur imposé).
function resolveOverlaps(components: PlacementComponent[], board: PlacementBoard): void {
  const ox = board.originX ?? 0;
  const oy = board.originY ?? 0;
  const maxX = ox + board.widthMm;
  const maxY = oy + board.heightMm;
  for (let pass = 0; pass < 40; pass += 1) {
    let moved = false;
    for (let i = 0; i < components.length; i += 1) {
      for (let j = i + 1; j < components.length; j += 1) {
        let a = components[i]!;
        let b = components[j]!;
        if ((a.locked && !b.locked) || (a.role === 'connector' && b.role !== 'connector')) {
          [a, b] = [b, a];
        }
        const overlapX =
          (a.widthMm ?? 10) / 2 + (b.widthMm ?? 10) / 2 + 1 - Math.abs(a.xMm - b.xMm);
        const overlapY =
          (a.heightMm ?? 10) / 2 + (b.heightMm ?? 10) / 2 + 1 - Math.abs(a.yMm - b.yMm);
        if (overlapX <= 0 || overlapY <= 0) continue;
        if (b.role === 'connector' || overlapX <= overlapY) {
          b.xMm = Math.max(
            ox + 2,
            Math.min(maxX - 2, b.xMm + (b.xMm >= a.xMm ? overlapX : -overlapX)),
          );
        } else {
          b.yMm = Math.max(
            oy + 2,
            Math.min(maxY - 2, b.yMm + (b.yMm >= a.yMm ? overlapY : -overlapY)),
          );
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
}

export function optimizePlacement(
  components: PlacementComponent[],
  nets: PlacementNet[],
  board: PlacementBoard,
): PlacementComponent[] {
  if (components.length === 0) return components;
  const adj = buildAdjacency(components, nets);
  const initial = cloneComponents(components);
  const initialCost = calculateCost(initial, adj, board, nets);

  // Étape 2 : passes séquentielles par blocs fonctionnels avant le recuit.
  placeSequentially(components, nets, board);
  const sequential = cloneComponents(components);
  let seed = sequential;
  let seedCost = calculateCost(sequential, adj, board, nets);

  // Garantie de non-régression : on démarre du meilleur des trois états.
  forceDirected(components, adj, board, 30);
  const forceCost = calculateCost(components, adj, board, nets);
  if (forceCost < seedCost) {
    seed = cloneComponents(components);
    seedCost = forceCost;
  }
  if (initialCost < seedCost) {
    seed = initial;
    seedCost = initialCost;
  }
  for (let i = 0; i < components.length; i += 1) {
    const src = seed[i]!;
    const dst = components[i]!;
    dst.xMm = src.xMm;
    dst.yMm = src.yMm;
    dst.rotation = src.rotation;
    dst.locked = src.locked;
    dst.anchorX = src.anchorX;
    dst.anchorY = src.anchorY;
    dst.movementRangeMm = src.movementRangeMm;
  }

  simulatedAnnealing(components, adj, board, nets, 800);

  // Le recuit ne doit jamais dégrader l'état de départ.
  if (calculateCost(components, adj, board, nets) > seedCost) {
    for (let i = 0; i < components.length; i += 1) {
      const src = seed[i]!;
      const dst = components[i]!;
      dst.xMm = src.xMm;
      dst.yMm = src.yMm;
      dst.rotation = src.rotation;
      dst.locked = src.locked;
      dst.anchorX = src.anchorX;
      dst.anchorY = src.anchorY;
      dst.movementRangeMm = src.movementRangeMm;
    }
  }

  // Dernières passes : orientations logiques, chevauchements, arrondi.
  optimizeRotations(components, nets);
  resolveOverlaps(components, board);

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
