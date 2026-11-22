'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePcbEditor } from '@/components/pcb/PcbEditorProvider';
import { computePlacement, snapToGrid } from '@/lib/pcb/placement';
import { SYMBOLS_BY_ID } from '@/lib/pcb/symbols';
import type { PlacementVerification } from '@/lib/pcb/verify-placement';
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
  const [force, setForce] = useState(false);
  const [allowOutside, setAllowOutside] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [verification, setVerification] = useState<PlacementVerification | null>(null);
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
    setVerification(null);

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
        body: JSON.stringify({ projectId, components: toPlace, dryRun, force, allowOutside }),
      });
      const dataPlace = await resPlace.json();

      if (!resPlace.ok) {
        const message = dataPlace.error ?? 'Placement échoué';
        const isHybrid =
          message.toLowerCase().includes('hybride tauri') ||
          message.toLowerCase().includes('mode web');
        toast.error(isHybrid ? 'Placement disponible en mode hybride Tauri' : message, {
          description: isHybrid ? 'Ouvrez PartIVA en desktop pour placer dans KiCad.' : undefined,
        });
        setResult({
          ok: false,
          message: isHybrid ? 'Disponible en mode hybride Tauri (desktop/web).' : message,
        });
        return;
      }

      const base = dryRun
        ? `Simulation OK : ${dataPlace.placed} composant(s)`
        : `${dataPlace.placed} composant(s) placé(s) dans KiCad`;

      let message = base;
      if (!dryRun) {
        if (typeof dataPlace.verified === 'number') {
          message += ` — ${dataPlace.verified} vérifié(s)`;
        }
        if (typeof dataPlace.backup === 'string' && dataPlace.backup) {
          const baseName = dataPlace.backup.split(/[\\/]/).pop() ?? dataPlace.backup;
          message += ` · sauvegarde : ${baseName}`;
        }
      }

      toast.success(message);
      setResult({ ok: true, message });

      if (!dryRun) {
        const resVerify = await fetch('/api/pcb/place/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            requested: toPlace.map((c) => ({
              reference: String(c.reference),
              xMm: c.xMm as number,
              yMm: c.yMm as number,
              rotation: (c.rotation as number | undefined) ?? 0,
            })),
          }),
        });
        const dataVerify = await resVerify.json();

        if (resVerify.ok && dataVerify.verification) {
          setVerification(dataVerify.verification as PlacementVerification);
        } else {
          toast.error(dataVerify.error ?? 'Vérification indisponible');
        }

        router.refresh();
      }
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
          <div className="flex flex-col space-y-1 text-[11px] text-gray-600">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
              Forcer (ignorer le verrou KiCad)
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={allowOutside}
                onChange={(e) => setAllowOutside(e.target.checked)}
              />
              Autoriser hors plateau
            </label>
          </div>
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

        {verification && (
          <div
            className={`rounded border p-2 text-xs ${
              verification.ok
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {verification.ok ? (
              <p>
                Placement vérifié : {verification.matched}/{verification.checked} conformes
              </p>
            ) : (
              <div>
                <p>
                  Vérification incomplète : {verification.matched}/{verification.checked} conformes
                </p>
                <ul className="mt-1 space-y-0.5">
                  {verification.misplaced.slice(0, 10).map((m) => (
                    <li key={`${m.reference}-${m.reason}`}>
                      {m.reference} —{' '}
                      {m.reason === 'position'
                        ? `position (écart ${(m.deltaMm ?? 0).toFixed(2)} mm)`
                        : m.reason === 'rotation'
                          ? 'rotation'
                          : 'absente de la carte'}
                    </li>
                  ))}
                  {verification.misplaced.length > 10 && <li>…</li>}
                </ul>
              </div>
            )}

            {verification.extra.length > 0 && (
              <p className="mt-1 text-gray-500">
                {verification.extra.length} empreinte(s) non demandée(s) sur la carte :{' '}
                {verification.extra.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
