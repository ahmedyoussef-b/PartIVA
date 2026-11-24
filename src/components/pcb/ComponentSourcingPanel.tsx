'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { usePcbEditor } from './PcbEditorProvider';
import type { ResolvedComponent } from '@/lib/pcb/component-mapping';

interface Candidate {
  id: string;
  name: string;
  category: string;
  footprint: string;
  symbol: string;
  supplier: string | null;
  supplierRef: string;
}

interface ProposedComponent {
  type: string;
  reference: string;
  value: string;
  libName: string;
  footprintName: string;
  quantity: number;
  xMm: number;
  yMm: number;
  rotation: number;
  rationale: string;
  searchKeyword: string;
  candidates: Candidate[];
}

interface Selection {
  libName: string;
  footprintName: string;
  value: string;
  reference: string;
  xMm: number;
  yMm: number;
  rotation: number;
}

const PX_PER_MM = 3.78;
const BOARD_ORIGIN_X = 59.69;
const BOARD_ORIGIN_Y = 81.28;

function symbolFor(reference: string): ResolvedComponent {
  const prefix = reference.replace(/[0-9].*$/, '').toUpperCase();
  const map: Record<string, { symbolId: string; refPrefix: string; label: string }> = {
    R: { symbolId: 'resistor', refPrefix: 'R', label: 'Résistance' },
    C: { symbolId: 'capacitor', refPrefix: 'C', label: 'Condensateur' },
    L: { symbolId: 'inductor', refPrefix: 'L', label: 'Inductance' },
    D: { symbolId: 'diode', refPrefix: 'D', label: 'Diode' },
    LED: { symbolId: 'led', refPrefix: 'LED', label: 'LED' },
    U: { symbolId: 'power', refPrefix: 'U', label: 'CI' },
    X: { symbolId: 'inductor', refPrefix: 'X', label: 'Cristal' },
    F: { symbolId: 'resistor', refPrefix: 'F', label: 'Fusible' },
    J: { symbolId: 'connector', refPrefix: 'J', label: 'Connecteur' },
    P: { symbolId: 'connector', refPrefix: 'P', label: 'Connecteur' },
  };
  const found = map[prefix] ?? {
    symbolId: 'resistor',
    refPrefix: prefix || 'X',
    label: 'Composant',
  };
  return found;
}

export function ComponentSourcingPanel({ projectId }: { projectId: string }) {
  const { addNode } = usePcbEditor();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [components, setComponents] = useState<ProposedComponent[]>([]);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [placing, setPlacing] = useState<number | null>(null);
  const [placingAll, setPlacingAll] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [netsMissing, setNetsMissing] = useState(false);
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [placeErrors, setPlaceErrors] = useState<Record<number, string>>({});
  const loadingRef = useRef(false);

  const fetchComponents = useCallback(
    async (peek = false, forceRefresh = false) => {
      const res = await fetch('/api/pcb/requirements/source-components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, peek, forceRefresh, force: forceRefresh }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Erreur ${res.status}`);
      return {
        components: (data.components ?? []) as ProposedComponent[],
        netsMissing: data.netsMissing === true,
      };
    },
    [projectId],
  );

  const load = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setPlaced({});
    setPlaceErrors({});
    try {
      const result = await fetchComponents();
      setComponents(result.components);
      setNetsMissing(result.netsMissing);
      setSelections({});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchComponents(true)
      .then((result) => {
        if (cancelled) return;
        setComponents(result.components);
        setNetsMissing(result.netsMissing);
        setSelections({});
        setPlaced({});
        setPlaceErrors({});
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erreur');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchComponents]);

  const optionFor = (comp: ProposedComponent, idx: number): Selection => {
    const sel = selections[idx] ?? -1;
    if (sel === -1) {
      return {
        libName: comp.libName,
        footprintName: comp.footprintName,
        value: comp.value,
        reference: comp.reference,
        xMm: comp.xMm,
        yMm: comp.yMm,
        rotation: comp.rotation,
      };
    }
    const c = comp.candidates[sel];
    if (!c) {
      return {
        libName: comp.libName,
        footprintName: comp.footprintName,
        value: comp.value,
        reference: comp.reference,
        xMm: comp.xMm,
        yMm: comp.yMm,
        rotation: comp.rotation,
      };
    }
    const lib =
      c.symbol && c.symbol.includes(':') ? c.symbol.split(':')[0] : c.category || comp.libName;
    return {
      libName: lib || comp.libName,
      footprintName: c.footprint || comp.footprintName,
      value: c.name || comp.value,
      reference: comp.reference,
      xMm: comp.xMm,
      yMm: comp.yMm,
      rotation: comp.rotation,
    };
  };

  const handlePlaceOne = async (idx: number, force = false) => {
    setPlacing(idx);
    setPlaceErrors((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
    try {
      const comp = components[idx];
      if (!comp) return;
      const s = optionFor(comp, idx);

      // Place in KiCad first : the backend returns the deterministic placement.
      const res = await fetch('/api/pcb/place/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          dryRun: false,
          force,
          optimize: true,
          components: [
            {
              libName: s.libName,
              footprintName: s.footprintName,
              reference: s.reference,
              value: s.value,
              xMm: s.xMm,
              yMm: s.yMm,
              rotation: s.rotation,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Erreur ${res.status}`);

      const opt = (data.optimized as Array<{ xMm: number; yMm: number; rotation: number }>)?.[0];
      const finalX = opt?.xMm ?? s.xMm;
      const finalY = opt?.yMm ?? s.yMm;
      const finalRotation = opt?.rotation ?? s.rotation;

      // Persist component with the optimized coordinates (never the LLM guesses).
      try {
        const persistRes = await fetch('/api/pcb/components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            components: [
              {
                reference: s.reference,
                name: s.value,
                symbol: `${s.libName}:${s.footprintName}`,
                footprint: `${s.libName}:${s.footprintName}`,
                positionX: finalX,
                positionY: finalY,
                rotation: finalRotation,
              },
            ],
          }),
        });
        if (!persistRes.ok) {
          const pj = await persistRes.json().catch(() => ({}));
          console.warn('Persist failed', pj);
        }
      } catch (pe) {
        console.warn('Persist error', pe);
      }

      setPlaced((prev) => ({
        ...prev,
        [idx]: `${data.placed ?? 0} placé(s) · ${data.verified ?? 0} vérifié(s)`,
      }));
      // Afficher dans le canvas PartIVA aux coordonnées optimisées.
      const sym = symbolFor(s.reference);
      const relX = finalX - BOARD_ORIGIN_X;
      const relY = finalY - BOARD_ORIGIN_Y;
      addNode(sym, Math.round(relX * PX_PER_MM), Math.round(relY * PX_PER_MM));
      window.dispatchEvent(new Event('pcb:board-refresh'));
      if (typeof data.hint === 'string' && data.hint.trim()) {
        toast.success('Composant placé dans le plateau', {
          description: 'KiCad : Fichier > Recharger pour afficher le composant.',
        });
      } else {
        toast.success('Composant placé dans KiCad et affiché dans PartIVA');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur de placement';
      const isHybrid =
        msg.toLowerCase().includes('hybride tauri') || msg.toLowerCase().includes('mode web');
      setPlaceErrors((prev) => ({
        ...prev,
        [idx]: isHybrid ? 'Disponible en mode hybride Tauri (desktop/web).' : msg,
      }));
      toast.error(isHybrid ? 'Placement disponible en mode hybride Tauri' : msg, {
        description: isHybrid ? 'Ouvrez PartIVA en desktop pour placer dans KiCad.' : undefined,
      });
    } finally {
      setPlacing(null);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const result = await fetchComponents(false, true);
      setComponents(result.components);
      setNetsMissing(result.netsMissing);
      setSelections({});
      setPlaced({});
      setPlaceErrors({});
      toast.success(
        result.netsMissing
          ? 'Composants régénérés, mais le LLM n’a toujours pas fourni de netlist. Vérifiez les clés/quotas des fournisseurs dans les logs serveur.'
          : 'Composants et netlist régénérés',
        { duration: 12_000 },
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Régénération impossible', {
        duration: 12_000,
      });
    } finally {
      setRegenerating(false);
    }
  };

  // Placement global : un seul appel avec tous les composants et la netlist
  // complète, pour que l'algorithme puisse réellement optimiser les distances.
  const handlePlaceAll = async () => {
    setPlacingAll(true);
    try {
      const items = components.map((comp, idx) => optionFor(comp, idx));
      const res = await fetch('/api/pcb/place/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          dryRun: false,
          force: true,
          optimize: true,
          components: items.map((s) => ({
            libName: s.libName,
            footprintName: s.footprintName,
            reference: s.reference,
            value: s.value,
            xMm: s.xMm,
            yMm: s.yMm,
            rotation: s.rotation,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Erreur ${res.status}`);

      const byRef = new Map(
        (
          (data.optimized ?? []) as Array<{
            reference: string;
            xMm: number;
            yMm: number;
            rotation: number;
          }>
        ).map((o) => [o.reference, o]),
      );
      const persistRes = await fetch('/api/pcb/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          components: items.map((s) => {
            const o = byRef.get(s.reference);
            return {
              reference: s.reference,
              name: s.value,
              symbol: `${s.libName}:${s.footprintName}`,
              footprint: `${s.libName}:${s.footprintName}`,
              positionX: o?.xMm ?? s.xMm,
              positionY: o?.yMm ?? s.yMm,
              rotation: o?.rotation ?? s.rotation,
            };
          }),
        }),
      });
      if (!persistRes.ok)
        console.warn('Persist global échoué', await persistRes.json().catch(() => ({})));

      window.dispatchEvent(new Event('pcb:board-refresh'));
      toast.success(
        `${data.placed ?? items.length} composant(s) placé(s) avec optimisation globale`,
        {
          description: data.liveSynced
            ? 'KiCad mis à jour en direct.'
            : 'KiCad : Fichier > Recharger pour voir le plateau.',
        },
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Placement global impossible');
    } finally {
      setPlacingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
        Chargement du sourcing composants…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
        <button type="button" className="ml-2 rounded border px-2 py-0.5 text-xs" onClick={load}>
          Réessayer
        </button>
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
        Aucun composant proposé. Vérifiez le contexte validé.
        <button type="button" className="ml-2 rounded border px-2 py-0.5 text-xs" onClick={load}>
          Relancer
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b bg-gray-50 p-3 text-sm font-semibold text-gray-700">
        <span>Sourcing composants ({components.length})</span>
        <button
          type="button"
          className="rounded border px-2 py-0.5 text-xs font-normal"
          onClick={handleRegenerate}
          disabled={regenerating}
        >
          {regenerating ? 'Régénération…' : 'Régénérer la netlist (LLM)'}
        </button>
        <button
          type="button"
          className="rounded border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-normal text-green-700"
          onClick={handlePlaceAll}
          disabled={placingAll}
        >
          {placingAll ? 'Placement…' : 'Tout placer (optimisé)'}
        </button>
      </div>
      {netsMissing && (
        <div className="border-b border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          Aucune netlist disponible : les connexions (ratsnest) ne peuvent pas être tracées. Cliquez
          sur « Régénérer la netlist » pour que l’IA produise les connexions entre pins.
        </div>
      )}
      <div className="space-y-3 p-4">
        {components.map((comp, idx) => {
          const options: { label: string; index: number }[] = [
            { label: `IA : ${comp.libName}:${comp.footprintName} (${comp.value})`, index: -1 },
            ...comp.candidates.map((c, ci) => ({
              label: `BDD : ${c.name} (${c.footprint || '—'})`,
              index: ci,
            })),
          ];
          return (
            <div key={idx} className="rounded border p-3 text-xs">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-semibold text-gray-800">
                  {comp.reference} — {comp.type}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    comp.candidates.length > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {comp.candidates.length > 0
                    ? `En stock (${comp.candidates.length})`
                    : 'Non trouvé en stock'}
                </span>
              </div>
              <div className="mb-1 text-gray-500">{comp.rationale}</div>
              <div className="mb-2 text-gray-600">
                Pos. proposée : ({comp.xMm}, {comp.yMm}) mm · rot. {comp.rotation}° · qté{' '}
                {comp.quantity}
              </div>
              <label className="block text-xs font-medium text-gray-700">
                Composant à implanter
              </label>
              <select
                className="mt-1 w-full rounded border p-1.5 text-xs"
                value={selections[idx] ?? -1}
                onChange={(e) =>
                  setSelections((prev) => ({ ...prev, [idx]: Number(e.target.value) }))
                }
              >
                {options.map((o) => (
                  <option key={o.index} value={o.index}>
                    {o.label}
                  </option>
                ))}
              </select>

              {placed[idx] && (
                <div className="mt-2 rounded border border-green-200 bg-green-50 p-2 text-xs text-green-700">
                  ✓ {placed[idx]}
                </div>
              )}
              {placeErrors[idx] && (
                <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                  <div>{placeErrors[idx]}</div>
                  {/verrou|\.lck|--force/i.test(placeErrors[idx] ?? '') && (
                    <button
                      type="button"
                      disabled={placing !== null}
                      onClick={() => handlePlaceOne(idx, true)}
                      className="mt-2 rounded bg-red-600 px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
                    >
                      Forcer le placement
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={placing !== null || !!placed[idx]}
                onClick={() => handlePlaceOne(idx)}
                className="mt-2 w-full rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {placing === idx
                  ? 'Placement en cours…'
                  : placed[idx]
                    ? 'Placé dans KiCad'
                    : 'Valider et placer dans KiCad'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
