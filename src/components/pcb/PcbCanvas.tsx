'use client';

import * as React from 'react';

type Pad = {
  number: string;
  type: string;
  shape: string;
  x: number;
  y: number;
  w: number;
  h: number;
  drill?: number;
  rotation: number;
  layers: string[];
};
type Graphic = {
  type: 'line' | 'rect' | 'circle' | 'arc';
  layer: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3?: number;
  y3?: number;
  width?: number;
};
type BoardComponent = {
  reference: string;
  value: string;
  x: number;
  y: number;
  rotation: number;
  layer: string;
  footprint: string;
  pads: Pad[];
  graphics: Graphic[];
};
type BoardData = {
  board: {
    origin: { x: number; y: number };
    dimensions: { width: number; height: number };
    edges: Graphic[];
  };
  components: BoardComponent[];
};

function rotatePoint(x: number, y: number, deg: number): { x: number; y: number } {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: x * c - y * s, y: x * s + y * c };
}

function toWorld(fpX: number, fpY: number, fpRot: number, lx: number, ly: number, lRot = 0) {
  const p = rotatePoint(lx, ly, fpRot + lRot);
  return { x: fpX + p.x, y: fpY + p.y };
}

export function PcbCanvas({ projectId }: { projectId?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [data, setData] = React.useState<BoardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchBoard = React.useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/pcb/board/render?projectId=${encodeURIComponent(projectId)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
      setData(json as BoardData);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement board');
    }
  }, [projectId]);

  React.useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  React.useEffect(() => {
    const handler = () => fetchBoard();
    window.addEventListener('pcb:board-refresh', handler);
    return () => window.removeEventListener('pcb:board-refresh', handler);
  }, [fetchBoard]);

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const dpr = window.devicePixelRatio || 1;
    const W = wrapper.clientWidth;
    const H = wrapper.clientHeight;
    if (canvas.width !== Math.floor(W * dpr) || canvas.height !== Math.floor(H * dpr)) {
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);

    const board = data?.board;
    const comps = data?.components ?? [];
    const bw = board?.dimensions.width || 100;
    const bh = board?.dimensions.height || 100;
    const ox = board?.origin.x || 0;
    const oy = board?.origin.y || 0;
    const pad = 24;
    const scale = Math.min((W - pad * 2) / bw, (H - pad * 2) / bh);
    const tx = pad - ox * scale + (W - pad * 2 - bw * scale) / 2;
    const ty = pad - oy * scale + (H - pad * 2 - bh * scale) / 2;
    const sx = (x: number) => tx + x * scale;
    const sy = (y: number) => ty + y * scale;

    // grid 1mm
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const startX = Math.floor(ox);
    const startY = Math.floor(oy);
    for (let x = startX; x <= ox + bw; x += 1) {
      const px = sx(x);
      ctx.beginPath();
      ctx.moveTo(px, sy(oy));
      ctx.lineTo(px, sy(oy + bh));
      ctx.stroke();
    }
    for (let y = startY; y <= oy + bh; y += 1) {
      const py = sy(y);
      ctx.beginPath();
      ctx.moveTo(sx(ox), py);
      ctx.lineTo(sx(ox + bw), py);
      ctx.stroke();
    }

    // board area
    ctx.fillStyle = '#0b3d2e';
    ctx.fillRect(sx(ox), sy(oy), bw * scale, bh * scale);

    // edge cuts
    ctx.strokeStyle = '#f0e68c';
    ctx.lineWidth = Math.max(1, 0.15 * scale);
    for (const e of board?.edges ?? []) {
      drawGraphic(ctx, e, sx, sy, scale);
    }
    if ((board?.edges ?? []).length === 0) {
      ctx.strokeRect(sx(ox), sy(oy), bw * scale, bh * scale);
    }

    // components
    for (const comp of comps) {
      // silkscreen/fab graphics
      for (const g of comp.graphics ?? []) {
        if (g.layer.includes('SilkS')) ctx.strokeStyle = '#f5f5dc';
        else if (g.layer.includes('Fab')) ctx.strokeStyle = '#888';
        else if (g.layer.includes('CrtYd')) ctx.strokeStyle = '#ff69b4';
        else continue;
        ctx.lineWidth = Math.max(0.5, (g.width || 0.12) * scale);
        drawGraphicLocal(ctx, comp, g, sx, sy, scale);
      }
      // pads
      for (const p of comp.pads ?? []) {
        const w = toWorld(comp.x, comp.y, comp.rotation, p.x, p.y, p.rotation);
        const pw = Math.max(1, p.w * scale);
        const ph = Math.max(1, p.h * scale);
        ctx.save();
        ctx.translate(sx(w.x), sy(w.y));
        ctx.rotate(((comp.rotation + p.rotation) * Math.PI) / 180);
        ctx.fillStyle = p.type === 'thru_hole' ? '#c0a000' : '#d4af37';
        if (p.shape.includes('circle') || (p.shape === 'oval' && Math.abs(p.w - p.h) < 0.01)) {
          ctx.beginPath();
          ctx.ellipse(0, 0, pw / 2, ph / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape.includes('oval') || p.shape.includes('roundrect')) {
          roundRect(ctx, -pw / 2, -ph / 2, pw, ph, Math.min(pw, ph) * 0.25);
          ctx.fill();
        } else {
          ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
        }
        if (p.drill) {
          ctx.fillStyle = '#111';
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(0.5, (p.drill * scale) / 2), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      // reference
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.max(8, 1.2 * scale)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(comp.reference, sx(comp.x), sy(comp.y));
    }
  }, [data]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
        <span>Rendu plateau KiCad {data ? `(${data.components.length} composants)` : ''}</span>
        {error && <span className="text-red-400">{error}</span>}
      </div>
      <div
        ref={wrapperRef}
        className="relative min-h-[300px] w-full flex-1 overflow-hidden rounded border border-gray-700"
      >
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      </div>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGraphic(
  ctx: CanvasRenderingContext2D,
  g: Graphic,
  sx: (x: number) => number,
  sy: (y: number) => number,
  scale: number,
) {
  ctx.lineWidth = Math.max(0.5, (g.width || 0.15) * scale);
  if (g.type === 'line') {
    ctx.beginPath();
    ctx.moveTo(sx(g.x1), sy(g.y1));
    ctx.lineTo(sx(g.x2), sy(g.y2));
    ctx.stroke();
  } else if (g.type === 'rect') {
    const x = Math.min(g.x1, g.x2),
      y = Math.min(g.y1, g.y2);
    ctx.strokeRect(sx(x), sy(y), Math.abs(g.x2 - g.x1) * scale, Math.abs(g.y2 - g.y1) * scale);
  } else if (g.type === 'circle') {
    const r = Math.hypot(g.x2 - g.x1, g.y2 - g.y1);
    ctx.beginPath();
    ctx.arc(sx(g.x1), sy(g.y1), r * scale, 0, Math.PI * 2);
    ctx.stroke();
  } else if (g.type === 'arc') {
    // Approximate arc as line for MVP
    ctx.beginPath();
    ctx.moveTo(sx(g.x1), sy(g.y1));
    ctx.lineTo(sx(g.x2), sy(g.y2));
    ctx.stroke();
  }
}

function drawGraphicLocal(
  ctx: CanvasRenderingContext2D,
  comp: BoardComponent,
  g: Graphic,
  sx: (x: number) => number,
  sy: (y: number) => number,
  scale: number,
) {
  const p1 = toWorld(comp.x, comp.y, comp.rotation, g.x1, g.y1);
  const p2 = toWorld(comp.x, comp.y, comp.rotation, g.x2, g.y2);
  const gg: Graphic = { ...g, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  drawGraphic(ctx, gg, sx, sy, scale);
}
