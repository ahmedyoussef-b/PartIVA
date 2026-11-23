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

function rotatePoint(x: number, y: number, deg: number) {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: x * c - y * s, y: x * s + y * c };
}
function toWorld(fpX: number, fpY: number, fpRot: number, lx: number, ly: number, lRot = 0) {
  const p = rotatePoint(lx, ly, fpRot + lRot);
  return { x: fpX + p.x, y: fpY + p.y };
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
  ctx.lineWidth = Math.max(0.75, (g.width || 0.12) * scale);
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
  drawGraphic(ctx, { ...g, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }, sx, sy, scale);
}

export function PcbCanvas({ projectId }: { projectId?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [data, setData] = React.useState<BoardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = React.useState(true);
  const [showPads, setShowPads] = React.useState(true);
  const [showSilk, setShowSilk] = React.useState(true);
  const [showRefs, setShowRefs] = React.useState(true);
  const [showFab, setShowFab] = React.useState(false);
  const [mode, setMode] = React.useState<'pan' | 'move'>('pan');
  const [dragComp, setDragComp] = React.useState<{
    ref: string;
    offsetX: number;
    offsetY: number;
    footprint: string;
    value: string;
    rotation: number;
  } | null>(null);
  const [busyRef, setBusyRef] = React.useState<string | null>(null);
  const [cursorMm, setCursorMm] = React.useState<{ x: number; y: number } | null>(null);
  const dragRef = React.useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const dragPosRef = React.useRef<{ x: number; y: number } | null>(null);

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

  const getTransform = React.useCallback(() => {
    const wrapper = wrapperRef.current;
    const W = wrapper?.clientWidth || 800;
    const H = wrapper?.clientHeight || 600;
    const board = data?.board;
    const bw = board?.dimensions.width || 100;
    const bh = board?.dimensions.height || 100;
    const ox = board?.origin.x || 0;
    const oy = board?.origin.y || 0;
    const pad = 28;
    const baseScale = Math.min((W - pad * 2) / bw, (H - pad * 2) / bh);
    const scale = baseScale * zoom;
    const tx = pad - ox * scale + (W - pad * 2 - bw * baseScale) / 2 + pan.x;
    const ty = pad - oy * scale + (H - pad * 2 - bh * baseScale) / 2 + pan.y;
    return { W, H, bw, bh, ox, oy, scale, tx, ty };
  }, [data, zoom, pan]);

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
    ctx.fillStyle = '#111315';
    ctx.fillRect(0, 0, W, H);

    const { bw, bh, ox, oy, scale, tx, ty } = getTransform();
    const sx = (x: number) => tx + x * scale;
    const sy = (y: number) => ty + y * scale;
    const comps = data?.components ?? [];

    ctx.fillStyle = '#0f3b2e';
    ctx.fillRect(sx(ox), sy(oy), bw * scale, bh * scale);

    if (showGrid) {
      const step = scale > 10 ? 1 : scale > 4 ? 5 : 10;
      const major = step * 5;
      const startX = Math.floor(ox / step) * step;
      const startY = Math.floor(oy / step) * step;
      for (let x = startX; x <= ox + bw; x += step) {
        ctx.strokeStyle = x % major === 0 ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx(x), sy(oy));
        ctx.lineTo(sx(x), sy(oy + bh));
        ctx.stroke();
      }
      for (let y = startY; y <= oy + bh; y += step) {
        ctx.strokeStyle = y % major === 0 ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx(ox), sy(y));
        ctx.lineTo(sx(ox + bw), sy(y));
        ctx.stroke();
      }
    }
    ctx.strokeStyle = '#d8c84b';
    ctx.lineWidth = Math.max(1.5, 0.18 * scale);
    for (const e of data?.board?.edges ?? []) drawGraphic(ctx, e, sx, sy, scale);
    if ((data?.board?.edges ?? []).length === 0)
      ctx.strokeRect(sx(ox), sy(oy), bw * scale, bh * scale);

    for (const comp of comps) {
      for (const g of comp.graphics ?? []) {
        const isSilk = g.layer.includes('SilkS');
        const isFab = g.layer.includes('Fab');
        const isCrt = g.layer.includes('CrtYd');
        if (isSilk && !showSilk) continue;
        if (isFab && !showFab) continue;
        if (!isSilk && !isFab && !isCrt) continue;
        ctx.strokeStyle = isSilk ? '#e8e3c5' : isFab ? '#8b8b8b' : '#d46ba0';
        drawGraphicLocal(ctx, comp, g, sx, sy, scale);
      }
      if (showPads) {
        for (const p of comp.pads ?? []) {
          const w = toWorld(comp.x, comp.y, comp.rotation, p.x, p.y, p.rotation);
          const pw = Math.max(1, p.w * scale);
          const ph = Math.max(1, p.h * scale);
          ctx.save();
          ctx.translate(sx(w.x), sy(w.y));
          ctx.rotate(((comp.rotation + p.rotation) * Math.PI) / 180);
          ctx.fillStyle = p.type === 'thru_hole' ? '#bfa53a' : '#d4b23a';
          ctx.strokeStyle = 'rgba(255,245,180,0.35)';
          ctx.lineWidth = Math.max(0.5, 0.05 * scale);
          if (p.shape.includes('circle') || (p.shape === 'oval' && Math.abs(p.w - p.h) < 0.01)) {
            ctx.beginPath();
            ctx.ellipse(0, 0, pw / 2, ph / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (p.shape.includes('oval') || p.shape.includes('roundrect')) {
            roundRect(ctx, -pw / 2, -ph / 2, pw, ph, Math.min(pw, ph) * 0.25);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
            ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
          }
          if (p.drill) {
            ctx.fillStyle = '#141414';
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0.5, (p.drill * scale) / 2), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
      if (showRefs && comp.reference) {
        ctx.font = `600 ${Math.max(9, 1.25 * scale)}px ui-monospace, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const text = comp.reference;
        const m = ctx.measureText(text);
        const px = sx(comp.x),
          py = sy(comp.y);
        const bw2 = m.width + 6,
          bh2 = Math.max(10, 1.25 * scale + 4);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(px - bw2 / 2, py - bh2 / 2, bw2, bh2);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, px, py);
      }
      if (dragComp?.ref === comp.reference || busyRef === comp.reference) {
        ctx.strokeStyle = dragComp?.ref === comp.reference ? '#38bdf8' : '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx(comp.x), sy(comp.y), Math.max(10, 3 * scale), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [data, getTransform, showGrid, showPads, showSilk, showRefs, showFab, dragComp, busyRef]);

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

  const screenToMm = React.useCallback(
    (clientX: number, clientY: number) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const { scale, tx, ty } = getTransform();
      return { x: (clientX - rect.left - tx) / scale, y: (clientY - rect.top - ty) / scale };
    },
    [getTransform],
  );

  const findCompAt = React.useCallback(
    (mmX: number, mmY: number) => {
      const comps = data?.components ?? [];
      let best: BoardComponent | null = null;
      let bestD = Infinity;
      for (const c of comps) {
        const d = Math.hypot(c.x - mmX, c.y - mmY);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      return bestD <= 8 ? best : null;
    },
    [data],
  );

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(20, Math.max(0.2, z * (e.deltaY < 0 ? 1.1 : 1 / 1.1))));
  };
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const mm = screenToMm(e.clientX, e.clientY);
    if (mode === 'move' && mm) {
      const comp = findCompAt(mm.x, mm.y);
      if (comp) {
        setDragComp({
          ref: comp.reference,
          offsetX: comp.x - mm.x,
          offsetY: comp.y - mm.y,
          footprint: comp.footprint,
          value: comp.value,
          rotation: comp.rotation,
        });
        dragPosRef.current = { x: comp.x, y: comp.y };
        return;
      }
    }
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const mm = screenToMm(e.clientX, e.clientY);
    if (mm) setCursorMm(mm);
    if (dragComp && mm) {
      dragPosRef.current = { x: mm.x + dragComp.offsetX, y: mm.y + dragComp.offsetY };
      setData((prev) =>
        prev
          ? {
              ...prev,
              components: prev.components.map((c) =>
                c.reference === dragComp.ref
                  ? { ...c, x: mm.x + dragComp.offsetX, y: mm.y + dragComp.offsetY }
                  : c,
              ),
            }
          : prev,
      );
      return;
    }
    const d = dragRef.current;
    if (d) setPan({ x: d.px + (e.clientX - d.sx), y: d.py + (e.clientY - d.sy) });
  };
  const finishDragComp = React.useCallback(
    async (
      ref: string,
      xMm: number,
      yMm: number,
      footprint: string,
      value: string,
      rotation: number,
    ) => {
      if (!projectId) return;
      const [libName, footprintName] = footprint.includes(':')
        ? footprint.split(':', 2)
        : ['', footprint];
      setBusyRef(ref);
      try {
        const res = await fetch('/api/pcb/place/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            dryRun: false,
            components: [{ libName, footprintName, reference: ref, value, xMm, yMm, rotation }],
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Erreur ' + res.status);
        await fetchBoard();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur déplacement');
        await fetchBoard();
      } finally {
        setBusyRef(null);
      }
    },
    [projectId, fetchBoard],
  );

  const onMouseUp = () => {
    if (dragComp) {
      const pos = dragPosRef.current;
      const d = dragComp;
      setDragComp(null);
      dragPosRef.current = null;
      if (pos) void finishDragComp(d.ref, pos.x, pos.y, d.footprint, d.value, d.rotation);
      return;
    }
    dragRef.current = null;
  };
  const onMouseLeave = () => {
    if (dragComp) {
      const pos = dragPosRef.current;
      const d = dragComp;
      setDragComp(null);
      dragPosRef.current = null;
      if (pos) void finishDragComp(d.ref, pos.x, pos.y, d.footprint, d.value, d.rotation);
    }
    dragRef.current = null;
    setCursorMm(null);
  };
  const fit = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const openInKicad = async () => {
    if (!projectId) return;
    await fetch('/api/pcb/projects/' + projectId + '/board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'launch' }),
    }).catch(() => {});
  };

  const Btn = ({
    active,
    onClick,
    children,
    title,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded px-2 py-1 hover:bg-gray-100 ${active ? 'bg-gray-200 font-medium' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1 rounded border bg-white p-1">
          <Btn onClick={() => setZoom((z) => Math.min(20, z * 1.2))} title="Zoom +">
            +
          </Btn>
          <Btn onClick={() => setZoom((z) => Math.max(0.2, z / 1.2))} title="Zoom -">
            −
          </Btn>
          <Btn onClick={() => setZoom(1)} title="Zoom 100%">
            100%
          </Btn>
          <Btn onClick={fit} title="Ajuster">
            Fit
          </Btn>
          <Btn onClick={fit} title="Recentrer">
            Reset vue
          </Btn>
          <Btn active={mode === 'pan'} onClick={() => setMode('pan')} title="Panoramique">
            Pan
          </Btn>
          <Btn
            active={mode === 'move'}
            onClick={() => setMode('move')}
            title="Déplacer un composant"
          >
            Déplacer
          </Btn>
          <Btn active={showGrid} onClick={() => setShowGrid((v) => !v)} title="Grille">
            Grille
          </Btn>
          <Btn active={showPads} onClick={() => setShowPads((v) => !v)} title="Pads">
            Pads
          </Btn>
          <Btn active={showSilk} onClick={() => setShowSilk((v) => !v)} title="Sérigraphie">
            Soie
          </Btn>
          <Btn active={showRefs} onClick={() => setShowRefs((v) => !v)} title="Références">
            Refs
          </Btn>
          <Btn active={showFab} onClick={() => setShowFab((v) => !v)} title="Fab">
            Fab
          </Btn>
          <Btn onClick={fetchBoard} title="Rafraîchir">
            Rafraîchir
          </Btn>
          <Btn onClick={openInKicad} title="Ouvrir dans KiCad">
            KiCad
          </Btn>
        </div>
        <span className="text-gray-500">
          {data ? `${data.components.length} composants` : 'Chargement…'} · {Math.round(zoom * 100)}
          %
        </span>
        <span className="text-gray-400">
          {cursorMm
            ? `X ${cursorMm.x.toFixed(2)} mm · Y ${cursorMm.y.toFixed(2)} mm`
            : 'Curseur hors plateau'}
        </span>
        {busyRef && <span className="text-blue-500">Déplacement {busyRef}…</span>}
        {error && <span className="text-red-500">{error}</span>}
      </div>
      <div
        ref={wrapperRef}
        className="relative min-h-[300px] w-full flex-1 overflow-hidden rounded border border-gray-700 bg-[#111315]"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 block h-full w-full ${mode === 'move' ? (dragComp ? 'cursor-grabbing' : 'cursor-crosshair') : 'cursor-grab active:cursor-grabbing'}`}
        />
      </div>
    </div>
  );
}
