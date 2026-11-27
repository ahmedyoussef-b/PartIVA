'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { usePcbEditor } from './PcbEditorProvider';
import { NetlistEditorModal } from './NetlistEditorModal';
import { useActionProgress } from './ActionProgressProvider';
import { createKicadFile } from '@/lib/pcb/client/kicad-file';
import { validateNetlist } from '@/lib/pcb/netlist-validation';
import { validateDfm } from '@/lib/pcb/dfm/jlcpcb-rules';
import { usePcbLiveState } from './PcbLiveStateProvider';
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

/**
 * Une réponse HTML (page 404 Next pendant une recompilation/HMR) faisait
 * échouer `res.json()` avec « Unexpected token '<' ». On rend le cas lisible
 * etactionnable pour l'utilisateur.
 */
function assertJsonResponse(res: Response): void {
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return;
  throw new Error(
    res.status === 404
      ? 'Route temporairement indisponible (404) — rechargez la page et réessayez.'
      : `Réponse inattendue du serveur (${res.status}) — réessayez.`,
  );
}

/** Résumé lisible des violations DRC catégorisées. */
function formatDrcCategories(drc: {
  categories?: Record<string, number>;
  preExisting?: number;
}): string | undefined {
  const c = drc.categories;
  if (!c) return undefined;
  const parts: string[] = [];
  if (c.placement) parts.push(`Placement : ${c.placement}`);
  if (c.routage) parts.push(`Routage : ${c.routage}`);
  if (c.fabrication) parts.push(`Fabrication : ${c.fabrication}`);
  if (drc.preExisting) parts.push(`Pré-existantes : ${drc.preExisting}`);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function ComponentSourcingPanel({ projectId }: { projectId: string }) {
  const { addNode } = usePcbEditor();
  const router = useRouter();
  const { state: liveState } = usePcbLiveState();
  const activeAction = liveState.nextActionId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [components, setComponents] = useState<ProposedComponent[]>([]);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [placing, setPlacing] = useState<number | null>(null);
  const [placingAll, setPlacingAll] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generatingNets, setGeneratingNets] = useState(false);
  const [routing, setRouting] = useState(false);
  const [freerouting, setFreerouting] = useState(false);
  const [freeroutingInfo, setFreeroutingInfo] = useState<string | null>(null);
  const [netsEditorOpen, setNetsEditorOpen] = useState(false);
  const [netsMissing, setNetsMissing] = useState(false);
  const [heuristicNets, setHeuristicNets] = useState(0);
  const [fullFlowRunning, setFullFlowRunning] = useState(false);
  const [fullFlowDone, setFullFlowDone] = useState(false);
  const fullRouted = fullFlowDone || (liveState.tracks ?? 0) > 0 || (liveState.zones ?? 0) > 0;
  const [resultShown, setResultShown] = useState(false);
  const [showingResult, setShowingResult] = useState(false);
  const [flowSummary, setFlowSummary] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [rerouting, setRerouting] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastTracks, setLastTracks] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [quote, setQuote] = useState<{
    ok: boolean;
    configured: boolean;
    price?: number;
    currency?: string;
    message?: string;
  } | null>(null);
  const [importReport, setImportReport] = useState<{
    format?: string;
    components?: Array<{ reference: string; value: string; footprint: string }>;
    nets?: Array<{ name: string; pins: string[] }>;
    warnings?: string[];
    counts?: { components: number; nets: number; warnings: number };
  } | null>(null);
  const [routingAttempts, setRoutingAttempts] = useState<
    Array<{
      id: string;
      score: number | null;
      tracks: number;
      violations: number;
      createdAt: string;
    }>
  >([]);
  const [lastDrc, setLastDrc] = useState<{
    details?: Array<{
      type: string;
      severity: string;
      description: string;
      x?: number;
      y?: number;
      category: string;
      suggestion: string;
    }>;
    categories?: Record<string, number>;
    preExisting?: number;
  } | null>(null);
  const { start: startProgress, finish: finishProgress } = useActionProgress();

  // Le plateau doit exister avant tout placement : création automatique si absent.
  const ensureBoard = useCallback(async () => {
    const status = await fetch(`/api/pcb/projects/${projectId}/board/status`)
      .then((r) => r.json())
      .catch(() => null);
    if (status?.inDb) return;
    await createKicadFile(projectId);
    toast.success('Fichier KiCad créé automatiquement');
    router.refresh();
  }, [projectId, router]);

  // KiCad garde le plateau en mémoire et ne voit pas les écritures externes :
  // on referme/rouvre la fenêtre pour qu'il reflète l'état réel du fichier.
  const reloadKiCad = useCallback(async () => {
    try {
      await fetch(`/api/pcb/projects/${projectId}/board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reload' }),
      });
    } catch {
      // Le fichier est à jour : un rechargement manuel reste possible dans KiCad.
    }
  }, [projectId]);
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const allPlaced = components.length > 0 && components.every((_, i) => !!placed[i]);
  const [placeErrors, setPlaceErrors] = useState<Record<number, string>>({});
  const loadingRef = useRef(false);

  const fetchComponents = useCallback(
    async (peek = false, forceRefresh = false) => {
      const res = await fetch('/api/pcb/requirements/source-components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, peek, forceRefresh, force: forceRefresh }),
      });
      assertJsonResponse(res);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Erreur ${res.status}`);
      return {
        components: (data.components ?? []) as ProposedComponent[],
        nets: (data.nets ?? []) as Array<{ name: string; pins: string[] }>,
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

  // Reset : revenir à l'état initial du Sourcing après un reset du plateau.
  useEffect(() => {
    const handler = () => {
      setComponents([]);
      setSelections({});
      setPlaced({});
      setPlaceErrors({});
      setNetsMissing(false);
      setHeuristicNets(0);
      setFullFlowDone(false);
      setResultShown(false);
      setFlowSummary(null);
      setError(null);
      setValidationIssues([]);
      setLoading(false);
    };
    window.addEventListener('pcb:sourcing-reset', handler);
    return () => window.removeEventListener('pcb:sourcing-reset', handler);
  }, []);

  const optionFor = (
    comp: ProposedComponent,
    idx: number,
    selMap: Record<number, number> = selections,
  ): Selection => {
    const sel = selMap[idx] ?? -1;
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

  const runPostPlacementPipeline = async () => {
    setRouting(true);
    startProgress('Placement manuel complet : placement optimis\u00e9');
    try {
      // Ré-optimiser le placement de tous les composants (source de vérité unique,
      // identique au flux complet) avant les connexions et le routage.
      const items = components.map((comp, idx) => optionFor(comp, idx));
      await placeComponents(items, { display: false, markPlaced: false });

      startProgress('Placement manuel complet : connexions');
      const netsRes = await fetch('/api/pcb/requirements/nets-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      assertJsonResponse(netsRes);
      const netsData = await netsRes.json();
      if (!netsRes.ok || !netsData.ok)
        throw new Error(netsData.error || `Erreur ${netsRes.status}`);
      setNetsMissing(false);
      setHeuristicNets(netsData.heuristicCount ?? 0);

      startProgress('Placement manuel complet : routage assisté');
      const routeRes = await fetch('/api/pcb/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      assertJsonResponse(routeRes);
      const routeData = await routeRes.json();
      if (!routeRes.ok || !routeData.ok)
        throw new Error(routeData.error || `Erreur ${routeRes.status}`);

      let freeroute: {
        tracks?: number;
        wires?: number;
        drc?: { violations?: number; unconnected?: number };
      } | null = null;
      let freerouteError: string | null = null;
      try {
        startProgress('Placement manuel complet : routage avancé (Freerouting)');
        const freeRes = await fetch('/api/pcb/autoroute/freerouting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        });
        assertJsonResponse(freeRes);
        const freeData = await freeRes.json();
        if (freeRes.ok && freeData.ok) {
          freeroute = freeData;
          setLastScore(typeof freeData.score === 'number' ? freeData.score : null);
          setLastTracks(freeData.tracks ?? 0);
        } else freerouteError = freeData.error ?? `Erreur ${freeRes.status}`;
      } catch (e) {
        freerouteError = e instanceof Error ? e.message : 'Freerouting indisponible';
      }

      const summary = freeroute
        ? `Routage complet : ${freeroute.tracks ?? 0} pistes · ${freeroute.wires ?? 0} connexions · ${freeroute.drc?.violations ?? 0} violation(s) DRC`
        : `Routage assisté : ${routeData.routed ?? 0} pistes · ${routeData.zones ?? 0} zone(s) GND${freerouteError ? ' · Freerouting indisponible' : ''}`;
      setFlowSummary(summary);
      setFullFlowDone(true);
      await showResult();
      toast.success('Placement manuel terminé — résultat affiché', {
        description: summary,
        duration: 12_000,
      });
      finishProgress('done');
    } catch (e) {
      finishProgress('error');
      toast.error(e instanceof Error ? e.message : 'Routage impossible', { duration: 12_000 });
    } finally {
      setRouting(false);
    }
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
      startProgress(`4. Placement de ${comp.reference} dans KiCad`);
      await ensureBoard();
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
      assertJsonResponse(res);
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

      const wasLast = components.length > 0 && components.every((_, i) => i === idx || !!placed[i]);

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
      toast.success('Composant placé ; pistes connectées déplacées avec lui', {
        description:
          data.movedTracks > 0
            ? `${data.movedTracks} extrémité(s) de piste suivie(s) — vérifiez la DRC.`
            : typeof data.hint === 'string' && data.hint.trim()
              ? data.hint
              : 'Fenêtre KiCad rouverte sur le plateau à jour.',
      });
      finishProgress('done');
      if (wasLast) {
        void runPostPlacementPipeline();
      }
    } catch (e) {
      finishProgress('error');
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
    startProgress('1. Génération des composants (LLM)');
    try {
      await ensureBoard();
      const result = await fetchComponents(false, true);
      setComponents(result.components);
      setNetsMissing(result.netsMissing);
      setSelections({});
      setPlaceErrors({});
      // Étape 1 : la BOM générée est immédiatement posée sur le layout.
      const items = result.components.map((comp, idx) => optionFor(comp, idx, {}));
      const placed = await placeComponents(items);
      toast.success(
        `${placed.placed ?? items.length} composant(s) généré(s) et placé(s) sur le layout${
          result.netsMissing ? ' — netlist absente, vérifiez les clés/quotas LLM' : ''
        }`,
        { duration: 12_000 },
      );
      router.refresh();
      finishProgress('done');
    } catch (e) {
      finishProgress('error');
      toast.error(e instanceof Error ? e.message : 'Régénération impossible', {
        duration: 12_000,
      });
    } finally {
      setRegenerating(false);
    }
  };

  // Génération des seules connexions : prompt compact, composants inchangés.
  const handleGenerateNetsOnly = async () => {
    setGeneratingNets(true);
    startProgress('2. Génération des connexions (GND/VCC)');
    try {
      const res = await fetch('/api/pcb/requirements/nets-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      assertJsonResponse(res);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setNetsMissing(false);
      setHeuristicNets(data.heuristicCount ?? 0);
      window.dispatchEvent(new Event('pcb:board-refresh'));
      toast.success(
        `${data.count} réseaux générés et connectés sur le layout (${(data.nets ?? [])
          .map((n: { name: string }) => n.name)
          .join(', ')})`,
        {
          description: data.boardAssigned
            ? `${data.boardPads ?? 0} pads assignés dans KiCad.`
            : 'Nets enregistrés en BDD ; assignation aux pads indisponible (KiCad Python).',
          duration: 12_000,
        },
      );
      await load();
      router.refresh();
      await reloadKiCad();
      finishProgress('done');
    } catch (e) {
      finishProgress('error');
      toast.error(e instanceof Error ? e.message : 'Génération des nets impossible', {
        duration: 12_000,
      });
    } finally {
      setGeneratingNets(false);
    }
  };

  const handleRouteBoard = async () => {
    setRouting(true);
    startProgress('5. Routage de la carte');
    try {
      const res = await fetch('/api/pcb/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      assertJsonResponse(res);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `Erreur ${res.status}`);
      window.dispatchEvent(new Event('pcb:board-refresh'));
      router.refresh();
      await reloadKiCad();
      toast.success(
        `Routage partiel : ${data.routed} pistes, ${data.zones} zone(s) GND, ${data.vias} via(s)`,
        {
          description: 'DRC non vérifié — la fenêtre KiCad a été rouverte sur le plateau à jour.',
          duration: 12_000,
        },
      );
      finishProgress('done');
    } catch (e) {
      finishProgress('error');
      toast.error(e instanceof Error ? e.message : 'Routage impossible', { duration: 12_000 });
    } finally {
      setRouting(false);
    }
  };

  const handleFreeroute = useCallback(async () => {
    setFreerouting(true);
    startProgress('6. Routage complet (Freerouting)');
    try {
      const res = await fetch('/api/pcb/autoroute/freerouting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      assertJsonResponse(res);
      const data = await res.json();
      if (data.code === 'FREEROUTING_MISSING') {
        setFreeroutingInfo(data.error ?? 'Freerouting non installé');
        toast.error('Freerouting non installé — DSN généré', { duration: 12_000 });
        finishProgress('error');
        return;
      }
      if (!res.ok || !data.ok) {
        if (data.logs) {
          setFreeroutingInfo(`${data.error ?? 'Échec Freerouting'}\n${data.logs}`);
        }
        throw new Error(data.error || `Erreur ${res.status}`);
      }
      setFreeroutingInfo(null);
      setLastScore(typeof data.score === 'number' ? data.score : null);
      setLastTracks(data.tracks ?? 0);
      setLastDrc(data.drc ?? null);
      fetch(`/api/pcb/projects/${projectId}/routing-attempts`)
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.attempts)) setRoutingAttempts(d.attempts);
        })
        .catch(() => {});
      window.dispatchEvent(new Event('pcb:board-refresh'));
      router.refresh();
      await reloadKiCad();
      toast.success(
        `Routage complet : ${data.tracks} pistes · ${data.wires ?? 0} connexions routées · ${
          data.drc?.violations ?? 0
        } violations DRC${typeof data.score === 'number' ? ` · Score : ${data.score}/1000` : ''}`,
        {
          description:
            formatDrcCategories(data.drc ?? {}) ??
            (data.drc?.unconnected > 0
              ? `${data.drc.unconnected} élément(s) encore non connecté(s).`
              : undefined),
          duration: 12_000,
        },
      );
      finishProgress('done');
    } catch (e) {
      finishProgress('error');
      toast.error(e instanceof Error ? e.message : 'Routage complet impossible', {
        duration: 12_000,
      });
    } finally {
      setFreerouting(false);
    }
  }, [projectId, reloadKiCad, router, startProgress, finishProgress]);

  // Placement global : un seul appel avec tous les composants et la netlist
  // complète, pour que l'algorithme puisse réellement optimiser les distances.
  // Placement global partagé : utilisé par « Optimiser la répartition » et
  // directement par « Générer les composants » pour poser la BOM sur le layout.
  const placeComponents = async (
    items: Selection[],
    opts: { display?: boolean; markPlaced?: boolean } = {},
  ) => {
    await ensureBoard();
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
    assertJsonResponse(res);
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

    if (opts.markPlaced !== false) {
      setPlaced(
        Object.fromEntries(items.map((_, idx) => [idx, `${data.placed ?? items.length} placé(s)`])),
      );
    }
    if (opts.display !== false) {
      window.dispatchEvent(new Event('pcb:board-refresh'));
      router.refresh();
      await reloadKiCad();
    }
    return data as { placed?: number; liveSynced?: boolean; movedTracks?: number };
  };

  const handlePlaceAll = async () => {
    setPlacingAll(true);
    startProgress('4. Optimisation de la répartition');
    try {
      const items = components.map((comp, idx) => optionFor(comp, idx));
      const data = await placeComponents(items);
      toast.success(`${data.placed ?? items.length} composant(s) réparti(s) sur le plateau`, {
        description:
          (data.movedTracks ?? 0) > 0
            ? `${data.movedTracks} extrémité(s) de piste suivie(s) — vérifiez la DRC.`
            : data.liveSynced
              ? 'KiCad mis à jour en direct.'
              : 'Fenêtre KiCad rouverte sur le plateau à jour.',
      });
      finishProgress('done');
    } catch (e) {
      finishProgress('error');
      toast.error(e instanceof Error ? e.message : 'Optimisation de la répartition impossible');
    } finally {
      setPlacingAll(false);
    }
  };

  const rerouteWithThreshold = async () => {
    if (typeof lastScore !== 'number') return;
    setRerouting(true);
    startProgress('Re-routage avec seuil de score');
    try {
      const res = await fetch('/api/pcb/autoroute/freerouting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, minScore: lastScore, restoreIfWorse: true }),
      });
      assertJsonResponse(res);
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        if (data.code === 'ROUTE_NOT_IMPROVED') {
          toast.info(data.error ?? 'Le nouveau routage est moins bon. L’ancien a été conservé.', {
            duration: 10_000,
          });
          return;
        }
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }
      setLastScore(data.score ?? null);
      setLastTracks(data.tracks ?? 0);
      setLastDrc(data.drc ?? null);
      fetch(`/api/pcb/projects/${projectId}/routing-attempts`)
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.attempts)) setRoutingAttempts(d.attempts);
        })
        .catch(() => {});
      window.dispatchEvent(new Event('pcb:board-refresh'));
      toast.success(`Re-routage terminé — Score : ${data.score}/1000`, { duration: 10_000 });
      finishProgress('done');
    } catch (e) {
      finishProgress('error');
      toast.error(e instanceof Error ? e.message : 'Re-routage impossible');
    } finally {
      setRerouting(false);
    }
  };

  const getQuote = async () => {
    try {
      const res = await fetch('/api/pcb/jlcpcb/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, quantity: 5 }),
      });
      assertJsonResponse(res);
      const data = await res.json();
      setQuote(data);
      if (data.ok) {
        toast.success(`Devis JLCPCB : ${data.price} ${data.currency ?? 'USD'}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Devis impossible');
    }
  };

  const importSchematicFile = async (file: File) => {
    setImporting(true);
    startProgress('Import du schéma');
    try {
      const form = new FormData();
      form.append('projectId', projectId);
      form.append('file', file);
      const res = await fetch('/api/pcb/import/schematic', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      setImportReport(data);
      window.dispatchEvent(new Event('pcb:board-refresh'));
      router.refresh();
      toast.success(
        `Import terminé : ${data.counts?.components ?? 0} composants, ${data.counts?.nets ?? 0} nets`,
      );
      finishProgress('done');
    } catch (e) {
      finishProgress('error');
      toast.error(e instanceof Error ? e.message : 'Import impossible');
    } finally {
      setImporting(false);
    }
  };

  const exportFabrication = async () => {
    setExporting(true);
    startProgress('Export fabrication JLCPCB');
    try {
      const res = await fetch('/api/pcb/export/fabrication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      assertJsonResponse(res);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      const link = document.createElement('a');
      link.href = `data:application/zip;base64,${data.base64}`;
      link.download = data.fileName ?? 'fabrication.zip';
      link.click();
      toast.success(`Archive fabrication prête (${data.fileCount} fichiers)`, {
        description: `Gerbers : ${data.gerberOk ? 'OK' : 'indisponible'} · Perçage : ${data.drillOk ? 'OK' : 'indisponible'}`,
        duration: 10_000,
      });
      finishProgress('done');
    } catch (e) {
      finishProgress('error');
      toast.error(e instanceof Error ? e.message : 'Export impossible');
    } finally {
      setExporting(false);
    }
  };

  const loadRoutingAttempts = useCallback(async () => {
    try {
      const res = await fetch(`/api/pcb/projects/${projectId}/routing-attempts`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.attempts)) setRoutingAttempts(data.attempts);
    } catch {
      // historique optionnel
    }
  }, [projectId, setRoutingAttempts]);

  useEffect(() => {
    const id = window.setTimeout(() => void loadRoutingAttempts(), 0);
    return () => window.clearTimeout(id);
  }, [loadRoutingAttempts]);

  const showResult = useCallback(async () => {
    setShowingResult(true);
    try {
      const res = await fetch(`/api/pcb/projects/${projectId}/board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'show' }),
      });
      assertJsonResponse(res);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `Erreur ${res.status}`);
      window.dispatchEvent(new Event('pcb:board-refresh'));
      setResultShown(true);
      router.refresh();
      toast.success('Résultat affiché dans le layout et dans KiCad', {
        description: data.kicadFilePath ? String(data.kicadFilePath) : undefined,
        duration: 10_000,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Affichage impossible', { duration: 12_000 });
    } finally {
      setShowingResult(false);
    }
  }, [projectId, router, setShowingResult, setResultShown]);

  const runFullFlow = async (displayAfter: boolean) => {
    if (fullFlowRunning) return;
    setFullFlowRunning(true);
    setFlowSummary(null);
    setResultShown(false);
    startProgress('Processus complet : composants (LLM)');
    try {
      await ensureBoard();
      const sourced = await fetchComponents(false, true);
      if (sourced.components.length === 0) throw new Error('Aucun composant proposé par le LLM');
      setComponents(sourced.components);
      setSelections({});
      setPlaceErrors({});
      setNetsMissing(sourced.netsMissing);
      const validation = validateNetlist(sourced.components, sourced.nets);
      if (!validation.ok) {
        setValidationIssues(validation.errors.map((e) => e.message));
        throw new Error(validation.errors[0]?.message ?? 'Netlist invalide');
      }
      setValidationIssues([]);

      startProgress('Processus complet : placement sur le layout');
      const items = sourced.components.map((comp, idx) => optionFor(comp, idx, {}));
      await placeComponents(items, { display: false, markPlaced: false });

      startProgress('Processus complet : connexions (GND/VCC)');
      const netsRes = await fetch('/api/pcb/requirements/nets-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      assertJsonResponse(netsRes);
      const netsData = await netsRes.json();
      if (!netsRes.ok || !netsData.ok)
        throw new Error(netsData.error || `Erreur ${netsRes.status}`);
      setNetsMissing(false);
      setHeuristicNets(netsData.heuristicCount ?? 0);

      startProgress('Processus complet : routage assisté');
      const routeRes = await fetch('/api/pcb/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      assertJsonResponse(routeRes);
      const routeData = await routeRes.json();
      if (!routeRes.ok || !routeData.ok)
        throw new Error(routeData.error || `Erreur ${routeRes.status}`);

      const assistedSummary = `Routage assisté : ${routeData.routed ?? 0} pistes · ${routeData.zones ?? 0} zone(s) GND`;
      setFullFlowDone(true);
      setFlowSummary(assistedSummary);
      router.refresh();

      let freeroute: {
        tracks?: number;
        wires?: number;
        drc?: { violations?: number; unconnected?: number };
      } | null = null;
      let freerouteError: string | null = null;
      try {
        startProgress('Processus complet : routage avancé (Freerouting)');
        const freeRes = await fetch('/api/pcb/autoroute/freerouting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        });
        assertJsonResponse(freeRes);
        const freeData = await freeRes.json();
        if (freeRes.ok && freeData.ok) {
          freeroute = freeData;
          setLastScore(typeof freeData.score === 'number' ? freeData.score : null);
          setLastTracks(freeData.tracks ?? 0);
        } else freerouteError = freeData.error ?? `Erreur ${freeRes.status}`;
      } catch (e) {
        freerouteError = e instanceof Error ? e.message : 'Freerouting indisponible';
      }

      const summary = freeroute
        ? `Routage complet : ${freeroute.tracks ?? 0} pistes · ${freeroute.wires ?? 0} connexions · ${freeroute.drc?.violations ?? 0} violation(s) DRC`
        : `${assistedSummary}${freerouteError ? ' · Freerouting indisponible' : ''}`;
      setFlowSummary(summary);
      finishProgress('done');
      toast.success('Processus complet terminé', {
        description: `${summary}${freerouteError ? ` (${freerouteError})` : ''}`,
        duration: 15_000,
      });
      router.refresh();
      if (displayAfter) await showResult();
    } catch (e) {
      finishProgress('error');
      toast.error(e instanceof Error ? e.message : 'Processus complet impossible', {
        duration: 15_000,
      });
    } finally {
      setFullFlowRunning(false);
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
      <div className="rounded-lg border bg-white">
        <div className="flex flex-col gap-2 border-b bg-gray-50 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span>Sourcing</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              title="Processus complet : composants, connexions et routage"
              className={`rounded border px-2 py-0.5 text-xs font-normal ${
                activeAction === 'components'
                  ? 'animate-pulse ring-2 ring-blue-600 ring-offset-2'
                  : ''
              }`}
              onClick={() => runFullFlow(false)}
              disabled={fullFlowRunning}
            >
              {fullFlowRunning ? 'Processus…' : 'Lancer'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex flex-col gap-2 border-b bg-gray-50 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span>Sourcing ({components.length})</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {fullRouted ? (
            <>
              <button
                type="button"
                title="Relancer le processus complet : composants, connexions, routage"
                className="rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs font-normal text-blue-700"
                onClick={() => runFullFlow(true)}
                disabled={fullFlowRunning}
              >
                {fullFlowRunning ? 'Processus…' : 'Relancer'}
              </button>
              <button
                type="button"
                title="Affiche le résultat complet dans le layout et ouvre le fichier KiCad nommé d'après le projet"
                className="rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white"
                onClick={showResult}
                disabled={showingResult || fullFlowRunning}
              >
                {showingResult
                  ? 'Affichage…'
                  : resultShown
                    ? 'Réafficher les résultats'
                    : 'Afficher les résultats'}
              </button>
              <button
                type="button"
                title="3. Corriger les connexions : ajouter/supprimer/éditer les nets manuellement"
                className={`rounded border px-2 py-0.5 text-xs font-normal ${
                  activeAction === 'edit-netlist'
                    ? 'animate-pulse ring-2 ring-blue-600 ring-offset-2'
                    : ''
                }`}
                onClick={() => setNetsEditorOpen(true)}
              >
                Éditer la Netlist
              </button>
            </>
          ) : (
            <>
              {/* Ordre logique du parcours : composants -> connexions -> correction ->
                placement -> pistes -> routage avancé. */}
              <button
                type="button"
                title="1. Générer les composants : appelle le LLM pour proposer la BOM (écrase les nets manuels)"
                className={`rounded border px-2 py-0.5 text-xs font-normal ${
                  activeAction === 'components'
                    ? 'animate-pulse ring-2 ring-blue-600 ring-offset-2'
                    : ''
                }`}
                onClick={handleRegenerate}
                disabled={regenerating}
              >
                {regenerating ? 'Génération…' : '1. Générer les composants (LLM)'}
              </button>
              <button
                type="button"
                title="2. Créer les connexions : génère les nets GND/VCC à partir des composants persistés"
                className={`rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs font-normal text-blue-700 ${
                  activeAction === 'nets' ? 'animate-pulse ring-2 ring-blue-600 ring-offset-2' : ''
                }`}
                onClick={handleGenerateNetsOnly}
                disabled={generatingNets}
              >
                {generatingNets ? 'Génération…' : '2. Générer les nets (GND/VCC)'}
              </button>
              <button
                type="button"
                title="3. Corriger les connexions : ajouter/supprimer/éditer les nets manuellement"
                className={`rounded border px-2 py-0.5 text-xs font-normal ${
                  activeAction === 'edit-netlist'
                    ? 'animate-pulse ring-2 ring-blue-600 ring-offset-2'
                    : ''
                }`}
                onClick={() => setNetsEditorOpen(true)}
              >
                Éditer la Netlist
              </button>
              <button
                type="button"
                title="4. Optimiser la répartition des composants sur le plateau"
                className={`rounded border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-normal text-green-700 ${
                  activeAction === 'place' ? 'animate-pulse ring-2 ring-blue-600 ring-offset-2' : ''
                }`}
                onClick={handlePlaceAll}
                disabled={placingAll}
              >
                {placingAll ? 'Optimisation…' : '4. Optimiser la répartition'}
              </button>
              <button
                type="button"
                title="5. Tracer les pistes et la zone GND"
                className={`rounded border border-purple-300 bg-purple-50 px-2 py-0.5 text-xs font-normal text-purple-700 ${
                  activeAction === 'route' ? 'animate-pulse ring-2 ring-blue-600 ring-offset-2' : ''
                }`}
                onClick={handleRouteBoard}
                disabled={routing}
              >
                {routing ? 'Routage…' : '5. Router la carte'}
              </button>
              <button
                type="button"
                title="6. Routage automatique avancé via Freerouting (nécessite Java + freerouting.jar)"
                className={`rounded border border-indigo-300 bg-indigo-50 px-2 py-0.5 text-xs font-normal text-indigo-700 ${
                  activeAction === 'freeroute'
                    ? 'animate-pulse ring-2 ring-blue-600 ring-offset-2'
                    : ''
                }`}
                onClick={handleFreeroute}
                disabled={freerouting}
              >
                {freerouting ? 'Routage complet…' : '6. Routage complet (Freerouting)'}
              </button>
            </>
          )}
        </div>
      </div>
      {netsMissing && (
        <div className="border-b border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          Aucune netlist disponible : les connexions (ratsnest) ne peuvent pas être tracées. Cliquez
          sur « 2. Générer les nets (GND/VCC) » pour produire uniquement les connexions, ou sur « 1.
          Générer les composants (LLM) » pour refaire aussi la BOM.
        </div>
      )}
      {heuristicNets > 0 && (
        <div className="border-b border-blue-200 bg-blue-50 p-2 text-xs text-blue-800">
          {heuristicNets} net(s) ont été inférés automatiquement (pins ou connexions manquants).
          Vérifiez-les via « Éditer la Netlist ».
        </div>
      )}
      {freeroutingInfo && (
        <div className="border-b border-indigo-200 bg-indigo-50 p-2 text-xs whitespace-pre-wrap text-indigo-900">
          {freeroutingInfo}
          <br />
          Installation : installez Java puis placez `freerouting.jar` dans `tools/` ou définissez la
          variable `FREEROUTING_JAR`. Le DSN complet a été exporté et peut être routé manuellement
          dans Freerouting.
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
      <div className="flex items-center gap-2 border-b bg-gray-50 p-2">
        <label className="cursor-pointer rounded border border-gray-400 bg-white px-2 py-1 text-[11px] font-medium text-gray-700">
          {importing ? 'Import…' : 'Importer un schéma'}
          <input
            type="file"
            accept=".sch,.brd,.net"
            className="hidden"
            disabled={importing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importSchematicFile(file);
              e.target.value = '';
            }}
          />
        </label>
        <span className="text-[10px] text-gray-500">Eagle .sch / .brd</span>
      </div>
      {validationIssues.length > 0 && (
        <div className="border-b border-red-200 bg-red-50 p-2 text-xs text-red-800">
          <div className="font-semibold">Netlist invalide — placement bloqué :</div>
          <ul className="mt-1 list-inside list-disc">
            {validationIssues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-2 rounded border border-red-300 bg-white px-2 py-0.5"
            onClick={() => setNetsEditorOpen(true)}
          >
            Éditer la Netlist
          </button>
        </div>
      )}
      {flowSummary && (
        <div className="border-b border-green-200 bg-green-50 p-2 text-xs text-green-800">
          {flowSummary}
        </div>
      )}
      {allPlaced && !fullRouted && (
        <div className="border-t bg-gray-50 p-3">
          <button
            type="button"
            onClick={runPostPlacementPipeline}
            disabled={routing || fullFlowRunning}
            className="rounded bg-purple-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {routing ? 'Routage…' : 'Placer routage et connexion'}
          </button>
          <p className="mt-1 text-[11px] text-gray-500">
            Génère les connexions et trace les pistes à partir des composants placés.
          </p>
        </div>
      )}
      {fullRouted && (
        <div className="space-y-2 border-t bg-gray-50 p-3 text-[11px] text-gray-500">
          <p>
            Le résultat est prêt : cliquez sur « Afficher les résultats » dans l&apos;en-tête
            ci-dessus pour l&apos;afficher dans le layout et dans KiCad.
          </p>
          {lastScore !== null && (
            <div className="rounded border border-blue-200 bg-blue-50 p-2 text-blue-900">
              <div className="font-semibold">Routage terminé</div>
              <div>Score : {lastScore}/1000</div>
              <div>Pistes : {lastTracks}</div>
              <div>
                Violations : {Object.values(lastDrc?.categories ?? {}).reduce((a, b) => a + b, 0)}
                {lastDrc?.categories
                  ? ` (${lastDrc.categories.placement ?? 0} placement, ${lastDrc.categories.routage ?? 0} routage)`
                  : ''}
              </div>
            </div>
          )}
          {lastScore !== null && (
            <button
              type="button"
              onClick={rerouteWithThreshold}
              disabled={rerouting || fullFlowRunning}
              className="rounded border border-indigo-300 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 disabled:opacity-50"
            >
              {rerouting ? 'Re-routage…' : 'Re-router avec score minimum'}
            </button>
          )}
          {routingAttempts.length > 1 && (
            <div className="rounded border bg-white p-2">
              <div className="font-semibold">Historique des routages</div>
              <div className="mt-1 flex h-16 items-end gap-1">
                {routingAttempts.map((a, i) => {
                  const height = Math.max(4, ((a.score ?? 0) / 1000) * 60);
                  return (
                    <div key={a.id} className="flex flex-1 flex-col items-center gap-0.5">
                      <div
                        className="w-full rounded-t bg-blue-400"
                        style={{ height: `${height}px` }}
                        title={`Routage ${i + 1} : ${a.score ?? '—'}/1000`}
                      />
                      <span className="text-[9px] text-gray-500">{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={getQuote}
            disabled={fullFlowRunning}
            className="rounded border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 disabled:opacity-50"
          >
            Obtenir un devis JLCPCB
          </button>
          {quote && (
            <p className={`${quote.ok ? 'text-green-700' : 'text-amber-700'}`}>
              {quote.ok
                ? `Devis estimé : ${quote.price} ${quote.currency ?? 'USD'}`
                : quote.message}
            </p>
          )}
          {lastDrc && (
            <div className="rounded border bg-white p-2">
              {validateDfm(lastDrc).ok ? (
                <span className="rounded bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                  ✓ Conforme JLCPCB
                </span>
              ) : (
                <>
                  <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                    ✗ Non conforme JLCPCB
                  </span>
                  <ul className="mt-1 space-y-0.5">
                    {validateDfm(lastDrc).violations.map((v, i) => (
                      <li key={i} className="text-gray-600">
                        {v.type} — {v.suggestion}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={exportFabrication}
            disabled={exporting || fullFlowRunning}
            className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {exporting ? 'Export…' : 'Exporter pour JLCPCB'}
          </button>
          {lastDrc && (lastDrc.details?.length ?? 0) > 0 && (
            <details className="rounded border bg-white p-2">
              <summary className="cursor-pointer font-semibold text-gray-700">
                Voir les détails DRC ({lastDrc.details?.length})
              </summary>
              <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                {lastDrc.details?.map((v, i) => (
                  <li key={`${v.type}-${i}`} className="rounded bg-gray-50 p-1.5">
                    <span className="font-semibold">{v.category}</span> · {v.type}
                    {typeof v.x === 'number' && typeof v.y === 'number'
                      ? ` @ (${v.x.toFixed(1)}, ${v.y.toFixed(1)})`
                      : ''}
                    <div className="text-gray-500">{v.suggestion}</div>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
      {importReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 text-xs">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Rapport d&apos;import ({importReport.format})
              </h3>
              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="rounded border px-2 py-0.5"
              >
                Fermer
              </button>
            </div>
            <p className="mb-2 text-gray-600">
              {importReport.counts?.components ?? 0} composants · {importReport.counts?.nets ?? 0}{' '}
              nets · {importReport.counts?.warnings ?? 0} avertissements
            </p>
            <div className="space-y-2">
              {(importReport.components ?? []).map((c) => (
                <div key={c.reference} className="rounded border p-2">
                  <span className="font-semibold">{c.reference}</span> · {c.value || '—'} ·{' '}
                  {c.footprint || 'sans empreinte'}
                </div>
              ))}
              {(importReport.nets ?? []).map((n) => (
                <div key={n.name} className="rounded border p-2">
                  <span className="font-semibold">{n.name}</span> : {n.pins.join(', ')}
                </div>
              ))}
              {(importReport.warnings ?? []).map((w, i) => (
                <div key={i} className="rounded bg-amber-50 p-2 text-amber-800">
                  {w}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {netsEditorOpen && (
        <NetlistEditorModal
          projectId={projectId}
          onClose={() => setNetsEditorOpen(false)}
          onSaved={(count) => {
            setNetsMissing(count === 0);
            window.dispatchEvent(new Event('pcb:board-refresh'));
          }}
        />
      )}
    </div>
  );
}
