'use client';

import * as React from 'react';

interface PcbNode {
  id: number;
  x: number;
  y: number;
  type: string;
}

const GRID_SIZE = 20;
const NODE_W = 36;
const NODE_H = 18;

export function PcbCanvas() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = React.useState<PcbNode[]>([]);
  const nextId = React.useRef(1);

  const draw = React.useCallback(() => {
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

    // Fond
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Grille
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

    // Composants
    nodes.forEach((n) => {
      ctx.fillStyle = '#3b82f6';
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(n.x - NODE_W / 2, n.y - NODE_H / 2, NODE_W, NODE_H);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`C${n.id}`, n.x, n.y);
    });
  }, [nodes]);

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

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNodes((prev) => {
      const node: PcbNode = { id: nextId.current++, x, y, type: 'default' };
      console.info('[PCB:EDITOR] Composant ajouté', { x, y });
      return [...prev, node];
    });
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
        <span>Cliquez sur la grille pour placer un composant</span>
        <span className="font-mono">{nodes.length} composant(s)</span>
      </div>
      <div
        ref={wrapperRef}
        className="relative w-full min-h-[300px] flex-1 overflow-hidden rounded border border-gray-700"
      >
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="block h-full w-full cursor-crosshair"
        />
      </div>
    </div>
  );
}