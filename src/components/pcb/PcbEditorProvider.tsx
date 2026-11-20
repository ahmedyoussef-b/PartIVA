'use client';

import * as React from 'react';
import type { ResolvedComponent } from '@/lib/pcb/component-mapping';

export type CanvasNode = { id: string; symbolId: string; x: number; y: number };

type PcbEditorContextValue = {
  nodes: CanvasNode[];
  addNode: (symbol: ResolvedComponent, x: number, y: number) => void;
  addNodeAtCenter: (symbol: ResolvedComponent) => void;
  canvasSize: { w: number; h: number };
  setCanvasSize: (w: number, h: number) => void;
};

const PcbEditorContext = React.createContext<PcbEditorContextValue | null>(null);

export function PcbEditorProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = React.useState<CanvasNode[]>([]);
  const [canvasSize, setCanvasSizeState] = React.useState({ w: 0, h: 0 });

  const setCanvasSize = React.useCallback((w: number, h: number) => {
    setCanvasSizeState({ w, h });
  }, []);

  const addNode = React.useCallback((symbol: ResolvedComponent, x: number, y: number) => {
    setNodes((prev) => {
      let max = 0;
      for (const n of prev) {
        if (n.symbolId === symbol.symbolId) {
          const num = parseInt(n.id.slice(symbol.refPrefix.length), 10);
          if (!Number.isNaN(num) && num > max) max = num;
        }
      }
      const id = `${symbol.refPrefix}${max + 1}`;
      console.info('[PCB:EDITOR] Composant ajouté', { id, symbolId: symbol.symbolId, x, y });
      return [...prev, { id, symbolId: symbol.symbolId, x, y }];
    });
  }, []);

  const addNodeAtCenter = React.useCallback(
    (symbol: ResolvedComponent) => {
      addNode(symbol, Math.round(canvasSize.w / 2), Math.round(canvasSize.h / 2));
    },
    [canvasSize, addNode],
  );

  const value = React.useMemo(
    () => ({ nodes, addNode, addNodeAtCenter, canvasSize, setCanvasSize }),
    [nodes, addNode, addNodeAtCenter, canvasSize, setCanvasSize],
  );

  return <PcbEditorContext.Provider value={value}>{children}</PcbEditorContext.Provider>;
}

export function usePcbEditor(): PcbEditorContextValue {
  const ctx = React.useContext(PcbEditorContext);
  if (!ctx) throw new Error('usePcbEditor must be used within PcbEditorProvider');
  return ctx;
}