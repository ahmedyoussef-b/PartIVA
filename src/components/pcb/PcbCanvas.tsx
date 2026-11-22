'use client';

import * as React from 'react';
import { usePcbEditor } from './PcbEditorProvider';
import { COMPONENT_SYMBOLS, SYMBOLS_BY_ID } from '@/lib/pcb/symbols';
import type { ResolvedComponent } from '@/lib/pcb/component-mapping';

const GRID_SIZE = 20;

export function PcbCanvas() {
  const { nodes, addNode, moveNode, setCanvasSize } = usePcbEditor();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = React.useState<{ x: number; y: number } | null>(null);
  const [menuLeft, setMenuLeft] = React.useState(0);
  const [dragging, setDragging] = React.useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const drawGrid = React.useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const dpr = window.devicePixelRatio || 1;
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }

    setCanvasSize(w, h);
  }, [setCanvasSize]);

  React.useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver(() => drawGrid());
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [drawGrid]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const wrapperWidth = wrapperRef.current?.clientWidth ?? rect.width;
    setMenuPos({ x, y: e.clientY - rect.top });
    setMenuLeft(Math.max(4, Math.min(x, wrapperWidth - 190)));
  };

  const pick = (symbol: ResolvedComponent) => {
    if (!menuPos) return;
    addNode(symbol, menuPos.x, menuPos.y);
    setMenuPos(null);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
        <span>Cliquez sur la grille puis choisissez un composant</span>
        <span className="font-mono">{nodes.length} composant(s)</span>
      </div>
      <div
        ref={wrapperRef}
        className="relative min-h-[300px] w-full flex-1 overflow-hidden rounded border border-gray-700"
        onMouseMove={(e) => {
          if (!dragging) return;
          const rect = wrapperRef.current?.getBoundingClientRect();
          if (!rect) return;
          const x = e.clientX - rect.left - dragging.offsetX;
          const y = e.clientY - rect.top - dragging.offsetY;
          moveNode(dragging.id, x, y);
        }}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
      >
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="absolute inset-0 block h-full w-full cursor-crosshair"
        />

        {/* Symboles SVG superposés (non cliquables) */}
        <div className="pointer-events-none absolute inset-0">
          {nodes.map((n) => {
            const sym = SYMBOLS_BY_ID[n.symbolId];
            if (!sym) return null;
            return (
              <div
                key={n.id}
                className="absolute flex cursor-grab flex-col items-center active:cursor-grabbing"
                style={{ left: n.x - 20, top: n.y - 20 }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const wrap = wrapperRef.current?.getBoundingClientRect();
                  if (!wrap) return;
                  setDragging({
                    id: n.id,
                    offsetX: e.clientX - rect.left - 20,
                    offsetY: e.clientY - rect.top - 20,
                  });
                }}
              >
                {sym.render({ size: 40, color: '#3b82f6' })}
                <span className="mt-0.5 font-mono text-[10px] text-gray-200">{n.id}</span>
              </div>
            );
          })}
        </div>

        {/* Menu contextuel */}
        {menuPos && (
          <div
            className="absolute z-10 w-48 rounded border border-gray-600 bg-gray-800 p-1 shadow-lg"
            style={{ left: menuLeft, top: menuPos.y }}
          >
            <div className="px-2 py-1 text-[10px] text-gray-400 uppercase">Composant</div>
            {COMPONENT_SYMBOLS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pick({ symbolId: s.id, refPrefix: s.refPrefix, label: s.label })}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-gray-100 hover:bg-gray-700"
              >
                <span className="inline-flex">{s.render({ size: 20, color: '#93c5fd' })}</span>
                <span className="flex-1">{s.label}</span>
                <span className="font-mono text-[10px] text-gray-400">{s.refPrefix}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
