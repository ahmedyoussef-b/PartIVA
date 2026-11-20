'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePcbEditor } from '@/components/pcb/PcbEditorProvider';
import { computePlacement, snapToGrid } from '@/lib/pcb/placement';
import { SYMBOLS_BY_ID } from '@/lib/pcb/symbols';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Override {
  xMm: number;
  yMm: number;
  rotation: number;
}

const GRID_MM = 2.54;

export function PlacementPanel({
  projectId,
  boardWidthMm,
  boardHeightMm,
}: {
  projectId: string;
  boardWidthMm: number;
  boardHeightMm: number;
}) {
  const router = useRouter();
  const { nodes, canvasSize } = usePcbEditor();
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [dryRun, setDryRun] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const computed = useMemo(
    () =>
      computePlacement(
        nodes.map((n) => ({ id: n.id, symbolId: n.symbolId, x: n.x, y: n.y })),
        {
          boardWidthMm,
          boardHeightMm,
          canvasWidthPx: canvasSize.w,
          canvasHeightPx: canvasSize.h,
          gridMm: GRID_MM,
        },
      ),
    [nodes, canvasSize.w, canvasSize.h, boardWidthMm, boardHeightMm],
  );

  const rows = computed.map((p) => {
    const o = overrides[p.id];
    return {
      ...p,
      xMm: o?.xMm ?? p.xMm,
      yMm: o?.yMm ?? p.yMm,
      rotation: o?.rotation ?? p.rotation,
    };
  });

  const setField = (id: string, field: 'xMm' | 'yMm' | 'rotation', raw: string) => {
    const parsed = Number.parseFloat(raw);
    if (Number.isNaN(parsed)) return;
    const current = rows.find((r) => r.id === id);
    if (!current) return;
    const next: Override = {
      xMm: field === 'xMm' ? snapToGrid(parsed, GRID_MM) : current.xMm,
      yMm: field === 'yMm' ? snapToGrid(parsed, GRID_MM) : current.yMm,
      rotation: field === 'rotation' ? parsed : current.rotation,
    };
    setOverrides((prev) => ({ ...prev, [id]: next }));
  };

  const handlePlace = async () => {
    const errors: string[] = [];
    const toPersist: Array<Record<string, unknown>> = [];
    const toPlace: Array<Record<string, unknown>> = [];

    for (const r of rows) {
      const symbol = SYMBOLS_BY_ID[r.symbolId];
      const name = symbol?.label ?? r.symbolId;
      const raw = symbol?.footprint;

      if (!raw) {
        errors.push(`${r.reference} : footprint inconnu`);
        continue;
      }

      const parts = raw.split(':');
      if (parts.length !== 2) {
        errors.push(`${r.reference} : footprint illisible (${raw})`);
        continue;
      }

      toPersist.push({
        reference: r.reference,
        name,
        symbol: r.symbolId,
        footprint: raw,
        positionX: r.xMm,
        positionY: r.yMm,
        rotation: r.rotation,
      });
      toPlace.push({
        reference: r.reference,
        libName: parts[0] ?? '',
        footprintName: parts[1] ?? '',
        xMm: r.xMm,
        yMm: r.yMm,
        rotation: r.rotation,
      });
    }

    if (errors.length > 0) {
      toast.error('Footprint manquant', { description: errors[0] });
      return;
    }
    if (toPlace.length === 0) {
      toast.error('Aucun composant à placer');
      return;
    }

    setPlacing(true);
    setResult(null);

    try {
      if (!dryRun) {
        const resPersist = await fetch('/api/pcb/components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, components: toPersist }),
        });
        const dataPersist = await resPersist.json();
        if (!resPersist.ok) {
          const message = dataPersist.error ?? 'Persistance échouée';
          toast.error(message);
          setResult({ ok: false, message });
          return;
        }
      }

      const resPlace = await fetch('/api/pcb/place/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, components: toPlace, dryRun }),
      });
      const dataPlace = await resPlace.json();

      if (!resPlace.ok) {
        const message = dataPlace.error ?? 'Placement échoué';
        toast.error(message);
        setResult({ ok: false, message });
        return;
      }

      const message = dryRun
        ? `Simulation OK : ${dataPlace.placed} composant(s)`
        : `${dataPlace.placed} composant(s) placé(s) dans KiCad`;

      toast.success(message);
      setResult({ ok: true, message });

      if (!dryRun) router.refresh();
    } catch {
      toast.error('Erreur réseau');
      setResult({ ok: false, message: 'Erreur réseau' });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <details className="rounded-lg border bg-white">
      <summary className="cursor-pointer p-3 text-sm font-semibold text-gray-700">
        Placement ({rows.length})
      </summary>
      <div className="space-y-3 p-3 pt-0">
        {nodes.length === 0 ? (
          <p className="text-xs text-gray-500">Aucun composant sur le canvas.</p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="rounded border p-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {r.reference}
                </Badge>
                <span className="text-xs font-medium">
                  {SYMBOLS_BY_ID[r.symbolId]?.label ?? r.symbolId}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <label className="text-[10px] text-gray-500">
                  X (mm)
                  <input
                    type="number"
                    step={GRID_MM}
                    value={r.xMm}
                    onChange={(e) => setField(r.id, 'xMm', e.target.value)}
                    className="mt-0.5 block w-20 rounded border px-1 py-0.5 text-xs"
                  />
                </label>
                <label className="text-[10px] text-gray-500">
                  Y (mm)
                  <input
                    type="number"
                    step={GRID_MM}
                    value={r.yMm}
                    onChange={(e) => setField(r.id, 'yMm', e.target.value)}
                    className="mt-0.5 block w-20 rounded border px-1 py-0.5 text-xs"
                  />
                </label>
                <label className="text-[10px] text-gray-500">
                  Rot (°)
                  <input
                    type="number"
                    step="15"
                    value={r.rotation}
                    onChange={(e) => setField(r.id, 'rotation', e.target.value)}
                    className="mt-0.5 block w-16 rounded border px-1 py-0.5 text-xs"
                  />
                </label>
              </div>
            </div>
          ))
        )}

        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <label className="flex items-center gap-1 text-[11px] text-gray-600">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Simulation (dry-run)
          </label>
          <Button size="sm" disabled={nodes.length === 0 || placing} onClick={handlePlace}>
            {placing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
            Placer dans KiCad
          </Button>
          <Button size="sm" variant="ghost" disabled={placing} onClick={() => setOverrides({})}>
            Réinitialiser
          </Button>
        </div>

        {result && (
          <p className={`text-xs ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
        )}
      </div>
    </details>
  );
}
