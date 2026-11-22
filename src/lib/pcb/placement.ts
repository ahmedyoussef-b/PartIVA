// Phase C.1 — Algorithme de positionnement (pur, testable).
// Convertit des positions canvas (px) en positions carte (mm), avec snapping
// sur la grille KiCad 2.54 mm et génération de références.

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
