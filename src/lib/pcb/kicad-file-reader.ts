// Kicad File Reader — parseur de fichier .kicad_pcb (S-expression)
// Format KiCad 9/10 : `(version 20241229)`, `(generator "pcbnew")`, indentation par tabulations.
// Aucune dépendance externe : tokenizer + arbre S-expression maison.
// NB : l'axe Y de KiCad pointe vers le bas. Les coordonnées sont renvoyées telles quelles,
// la conversion éventuelle sera faite en A6.

export interface ParsedFootprint {
  library: string;
  name: string;
  reference: string;
  value?: string;
  x: number;
  y: number;
  rotation: number;
  layer: string;
}

export interface ParsedKicadPcb {
  version: number | null;
  generator: string | null;
  origin: { x: number; y: number };
  dimensions: { width: number; height: number };
  components: ParsedFootprint[];
}

type Sexpr = string | Sexpr[];

type Token = { type: 'lparen' | 'rparen' | 'atom' | 'string'; value: string };

const EDGE_LAYER = 'Edge.Cuts';

function isList(node: Sexpr | undefined): node is Sexpr[] {
  return Array.isArray(node);
}

function head(node: Sexpr | undefined): string | null {
  if (!isList(node) || node.length === 0) return null;
  return typeof node[0] === 'string' ? (node[0] as string) : null;
}

function children(node: Sexpr | undefined, name: string): Sexpr[][] {
  if (!isList(node)) return [];
  const out: Sexpr[][] = [];
  for (const child of node) {
    if (head(child) === name) out.push(child as Sexpr[]);
  }
  return out;
}

function firstChild(node: Sexpr | undefined, name: string): Sexpr[] | null {
  const found = children(node, name);
  return found.length > 0 ? (found[0] as Sexpr[]) : null;
}

function atom(node: Sexpr | undefined): string | null {
  return typeof node === 'string' ? node : null;
}

function num(node: Sexpr | undefined): number | null {
  if (typeof node !== 'string') return null;
  const value = Number.parseFloat(node);
  return Number.isNaN(value) ? null : value;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const length = text.length;
  let i = 0;

  while (i < length) {
    const ch = text[i] as string;

    if (ch === '(') {
      tokens.push({ type: 'lparen', value: ch });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ch });
      i += 1;
      continue;
    }
    if (ch === ';') {
      while (i < length && text[i] !== '\n') i += 1;
      continue;
    }
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === '"') {
      let value = '';
      i += 1;
      while (i < length && text[i] !== '"') {
        if (text[i] === '\\') {
          i += 1;
          if (i >= length) break;
        }
        value += text[i];
        i += 1;
      }
      i += 1;
      tokens.push({ type: 'string', value });
      continue;
    }

    let value = '';
    while (i < length) {
      const c = text[i] as string;
      if (c === '(' || c === ')' || c === '"' || /\s/.test(c)) break;
      value += c;
      i += 1;
    }
    if (value.length > 0) tokens.push({ type: 'atom', value });
  }

  return tokens;
}

function parseTokens(tokens: Token[]): Sexpr[] {
  let pos = 0;

  const parseExpr = (): Sexpr => {
    const token = tokens[pos] as Token;
    pos += 1;

    if (token.type === 'lparen') {
      const list: Sexpr[] = [];
      while (pos < tokens.length && (tokens[pos] as Token).type !== 'rparen') {
        list.push(parseExpr());
      }
      pos += 1;
      return list;
    }

    return token.value;
  };

  const result: Sexpr[] = [];
  while (pos < tokens.length) result.push(parseExpr());
  return result;
}

function parseAt(node: Sexpr | undefined): { x: number; y: number; rotation: number } | null {
  const at = firstChild(node, 'at');
  if (!at) return null;

  const x = num(at[1]);
  const y = num(at[2]);
  if (x === null || y === null) return null;

  const rotation = at.length > 3 ? num(at[3]) : null;
  return { x, y, rotation: rotation ?? 0 };
}

function propertyText(node: Sexpr | undefined, propName: string): string | null {
  for (const prop of children(node, 'property')) {
    const name = atom(prop[1]);
    if (name === propName) {
      return atom(prop[2]);
    }
  }
  return null;
}

function collectEdgePoints(node: Sexpr | undefined, points: Array<{ x: number; y: number }>): void {
  if (!isList(node)) return;

  for (const child of node) {
    const kind = head(child);
    if (kind !== 'gr_line' && kind !== 'gr_rect' && kind !== 'gr_poly') continue;

    const layerNode = firstChild(child, 'layer');
    const layer = layerNode ? atom(layerNode[1]) : null;
    if (layer !== EDGE_LAYER) continue;

    if (kind === 'gr_poly') {
      const pts = firstChild(child, 'pts');
      if (!pts) continue;
      for (const xy of children(pts, 'xy')) {
        const x = num(xy[1]);
        const y = num(xy[2]);
        if (x !== null && y !== null) points.push({ x, y });
      }
      continue;
    }

    const start = firstChild(child, 'start');
    const end = firstChild(child, 'end');
    for (const point of [start, end]) {
      const x = num(point?.[1]);
      const y = num(point?.[2]);
      if (x !== null && y !== null) points.push({ x, y });
    }
  }
}

function parseFootprint(node: Sexpr): ParsedFootprint | null {
  const libRef = atom(node[1]) ?? '';
  const separator = libRef.indexOf(':');
  const library = separator >= 0 ? libRef.slice(0, separator) : '';
  const name = separator >= 0 ? libRef.slice(separator + 1) : libRef;

  const layerNode = firstChild(node, 'layer');
  const layer = (layerNode ? atom(layerNode[1]) : null) ?? 'F.Cu';

  const position = parseAt(node) ?? { x: 0, y: 0, rotation: 0 };
  const reference = propertyText(node, 'Reference') ?? '';
  const value = propertyText(node, 'Value') ?? undefined;

  return {
    library,
    name,
    reference,
    value,
    x: position.x,
    y: position.y,
    rotation: position.rotation,
    layer,
  };
}

export function parseKicadPcb(input: string | Buffer): ParsedKicadPcb {
  const text = typeof input === 'string' ? input : input.toString('utf-8');
  const tree = parseTokens(tokenize(text));
  const root = tree.find((node) => head(node) === 'kicad_pcb');

  if (!root) {
    return {
      version: null,
      generator: null,
      origin: { x: 0, y: 0 },
      dimensions: { width: 0, height: 0 },
      components: [],
    };
  }

  const versionNode = firstChild(root, 'version');
  const version = versionNode ? num(versionNode[1]) : null;

  const generatorNode = firstChild(root, 'generator');
  const generator = generatorNode ? atom(generatorNode[1]) : null;

  const points: Array<{ x: number; y: number }> = [];
  collectEdgePoints(root, points);

  let origin = { x: 0, y: 0 };
  let dimensions = { width: 0, height: 0 };

  if (points.length > 0) {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    origin = { x: minX, y: minY };
    dimensions = { width: maxX - minX, height: maxY - minY };
  }

  const components: ParsedFootprint[] = [];
  for (const footprint of children(root, 'footprint')) {
    const parsed = parseFootprint(footprint);
    if (parsed) components.push(parsed);
  }

  return { version, generator, origin, dimensions, components };
}
