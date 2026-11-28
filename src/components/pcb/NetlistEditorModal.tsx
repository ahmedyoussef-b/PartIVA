'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useActionProgress } from './ActionProgressProvider';
import {
  diagnosePins,
  mergePinIssues,
  pinIssueMessage,
  splitPinInput,
} from '@/lib/pcb/pin-diagnostics';
import type { NetlistPinIssue, NetlistReport } from '@/lib/pcb/netlist-validation';

interface NetRow {
  id: string;
  name: string;
  pins: string[];
  source?: string;
}

interface Props {
  projectId: string;
  onClose: () => void;
  onSaved: (count: number) => void;
}

export function NetlistEditorModal({ projectId, onClose, onSaved }: Props) {
  const [original, setOriginal] = useState<NetRow[]>([]);
  const [draft, setDraft] = useState<NetRow[]>([]);
  const [report, setReport] = useState<NetlistReport | null>(null);
  const [padsByRef, setPadsByRef] = useState<Record<string, string[]>>({});
  const [refs, setRefs] = useState<string[]>([]);
  const [footprintsByRef, setFootprintsByRef] = useState<Record<string, string>>({});
  const [serverIssues, setServerIssues] = useState<NetlistPinIssue[]>([]);
  const [pinDrafts, setPinDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { start: startProgress, finish: finishProgress } = useActionProgress();

  /** Une seule source de vérité : le GET. Aucune copie locale du rapport. */
  const fetchNets = useCallback(
    async (apply: boolean) => {
      const res = await fetch(
        `/api/pcb/requirements/nets?projectId=${encodeURIComponent(projectId)}`,
      );
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `Erreur ${res.status}`);
      const nets = (data.nets ?? []) as NetRow[];
      const netlistReport = (data.netlistReport ?? null) as NetlistReport | null;
      const pads = (data.padsByRef ?? {}) as Record<string, string[]>;
      const knownRefs = (data.refs ?? []) as string[];
      const footprints = (data.footprintsByRef ?? {}) as Record<string, string>;
      if (apply) {
        setOriginal(nets);
        setDraft(nets);
        setReport(netlistReport);
        setPadsByRef(pads);
        setRefs(knownRefs);
        setFootprintsByRef(footprints);
        setServerIssues([]);
        setPinDrafts({});
      }
      return { nets, netlistReport };
    },
    [projectId],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchNets(!cancelled);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : 'Chargement de la netlist impossible');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchNets]);

  const reload = async () => {
    try {
      await fetchNets(true);
      toast.success('Netlist rechargée depuis le serveur');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Rechargement impossible');
    }
  };

  const updateRow = (index: number, patch: Partial<NetRow>) => {
    const before = draft[index]?.name ?? '';
    const after = patch.name ?? before;
    setDraft((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    // Un diagnostic serveur n'est valable que pour la valeur qui l'a produit.
    setServerIssues((issues) =>
      issues.filter((issue) => issue.net !== before && issue.net !== after),
    );
  };

  const rowKey = (row: NetRow, index: number) => row.id || `new-${index}`;

  const addPins = (index: number) => {
    const row = draft[index];
    if (!row) return;
    const key = rowKey(row, index);
    const parts = splitPinInput(pinDrafts[key] ?? '');
    if (parts.length > 0) updateRow(index, { pins: [...row.pins, ...parts] });
    setPinDrafts((prev) => ({ ...prev, [key]: '' }));
  };

  const removePin = (index: number, pinIndex: number) => {
    const row = draft[index];
    if (!row) return;
    updateRow(index, { pins: row.pins.filter((_, i) => i !== pinIndex) });
  };

  const localIssues = diagnosePins({
    nets: draft.map((row) => ({ name: row.name.trim(), pins: row.pins })),
    padsByRef,
    refs,
    footprintsByRef,
  });
  const pinIssues = mergePinIssues(serverIssues, localIssues);

  /** Un seul PUT atomique : plus de boucle de PATCH, plus d'état partiel. */
  const save = async () => {
    const seen = new Set<string>();
    for (const row of draft) {
      const name = row.name.trim();
      if (!name) {
        toast.error('Tous les nets doivent avoir un nom');
        return;
      }
      const key = name.toLowerCase();
      if (seen.has(key)) {
        toast.error(`Net en double : ${name}`);
        return;
      }
      seen.add(key);
    }

    setSaving(true);
    startProgress('3. Sauvegarde de la netlist');
    let status: 'done' | 'error' = 'error';
    try {
      const res = await fetch('/api/pcb/requirements/nets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          nets: draft.map((row) => ({
            ...(row.id ? { id: row.id } : {}),
            name: row.name.trim(),
            pins: row.pins,
            ...(row.source ? { source: row.source } : {}),
          })),
          expectedIds: original.map((row) => row.id),
        }),
      });
      const data = await res.json();

      if (res.status === 409 && data.error === 'NETLIST_CONFLICT') {
        const fresh = (data.nets ?? []) as NetRow[];
        setOriginal(fresh);
        setDraft(fresh);
        setReport((data.netlistReport ?? null) as NetlistReport | null);
        toast.warning(
          'La netlist a été modifiée ailleurs : données rechargées. Vérifiez vos modifications.',
          { duration: 10_000 },
        );
        return;
      }
      if (res.status === 422 && data.error === 'INVALID_NETLIST') {
        const issues = Array.isArray(data.issues) ? data.issues : [];
        const pinIssuesFromServer: NetlistPinIssue[] = issues
          .filter((i: { code?: string; pin?: string }) => i.code === 'PIN_ISSUE' && !!i.pin)
          .map(
            (i: {
              net?: string;
              ref?: string;
              pin: string;
              reason?: NetlistPinIssue['reason'];
              available?: string[];
              footprint?: string;
              message?: string;
            }) => ({
              net: i.net ?? '',
              ref: i.ref ?? i.pin.split('.')[0] ?? '',
              pin: i.pin,
              reason: i.reason ?? 'BAD_FORMAT',
              available: i.available,
              footprint: i.footprint,
            }),
          );
        setServerIssues(pinIssuesFromServer);
        const first = issues[0] as { message?: string } | undefined;
        toast.error(
          first?.message ||
            (pinIssuesFromServer[0]
              ? pinIssueMessage(pinIssuesFromServer[0]!)
              : 'Netlist invalide'),
        );
        return;
      }
      if (!res.ok || !data.ok)
        throw new Error(data.error || data.message || `Erreur ${res.status}`);

      const saved = (data.nets ?? []) as NetRow[];
      setOriginal(saved);
      setDraft(saved);
      setReport((data.netlistReport ?? null) as NetlistReport | null);
      status = 'done';
      toast.success(`${saved.length} net(s) sauvegardés`);
      onSaved(saved.length);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sauvegarde impossible');
    } finally {
      finishProgress(status);
      setSaving(false);
    }
  };

  const invalidPins = Array.isArray(report?.invalidPins) ? report!.invalidPins : [];
  const droppedPins = Array.isArray(report?.droppedPins) ? report!.droppedPins : [];
  const droppedNets = Array.isArray(report?.droppedNets) ? report!.droppedNets : [];
  const toVerify = Array.isArray(report?.toVerify) ? report!.toVerify : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg border bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Édition de la netlist</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded border px-2 py-0.5 text-[11px] text-gray-600 disabled:opacity-50"
              onClick={reload}
              disabled={loading || saving}
            >
              Recharger
            </button>
            <button type="button" className="text-sm text-gray-500" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {report && (
          <div className="mb-3 rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
            <p className="font-semibold">
              Rapport de génération{report.stale ? ' — périmé' : ''}
              {report.code ? ` (${report.code})` : ''}
            </p>
            <p>
              {invalidPins.length} pin(s) invalide(s) · {droppedPins.length} retiré(s) ·{' '}
              {droppedNets.length} net(s) supprimé(s)
            </p>
            {invalidPins.slice(0, 5).map((issue, i) => (
              <p key={`${issue.pin}-${i}`}>
                {issue.pin} — {issue.reason}
                {issue.available?.length
                  ? ` (pads disponibles : ${issue.available.join(', ')})`
                  : ''}
              </p>
            ))}
            {toVerify.length > 0 && <p>À vérifier : {toVerify.join(', ')}</p>}
            <p className="mt-1 text-[10px] opacity-75">
              Diagnostic de la génération initiale, pas de l’état en cours d’édition.
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : (
          <>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="border p-2">Nom du net</th>
                  <th className="border p-2">
                    <span className="inline-flex items-center gap-1">
                      Pins (séparés par des virgules)
                      <span
                        role="note"
                        aria-label="Aide sur le format des pins"
                        title="Entrez les broches au format REF.PIN, séparées par des virgules. Exemple : U1.7, U2.3 pour relier la broche 7 de U1 à la broche 3 de U2. Les numéros de broches doivent correspondre aux empreintes générées."
                        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-gray-400 text-[10px] font-bold text-gray-600"
                      >
                        ?
                      </span>
                    </span>
                  </th>
                  <th className="w-10 border p-2" />
                </tr>
              </thead>
              <tbody>
                {draft.map((row, index) => (
                  <tr key={row.id || `new-${index}`}>
                    <td className="border p-1">
                      <div className="flex items-center gap-1">
                        <input
                          className="min-w-0 flex-1 rounded border px-1 py-0.5"
                          value={row.name}
                          onChange={(e) => updateRow(index, { name: e.target.value })}
                        />
                        {row.source === 'heuristic' && (
                          <span
                            title="Net inféré automatiquement — à vérifier"
                            className="shrink-0 rounded bg-blue-100 px-1 text-[9px] font-bold text-blue-700"
                          >
                            IA?
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border p-1">
                      <div
                        className="flex min-h-6 flex-wrap items-center gap-1"
                        data-testid={`pins-${rowKey(row, index)}`}
                      >
                        {row.pins.map((pin, pinIndex) => {
                          const issues = pinIssues.filter(
                            (issue) => issue.net === row.name.trim() && issue.pin === pin,
                          );
                          const blocking = issues.some(
                            (issue) => issue.reason !== 'PAD_NOT_READABLE',
                          );
                          const warningOnly = issues.length > 0 && !blocking;
                          return (
                            <span
                              key={`${pin}-${pinIndex}`}
                              title={
                                issues.length ? issues.map(pinIssueMessage).join(' ') : `Pin ${pin}`
                              }
                              aria-invalid={blocking || undefined}
                              className={`inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[10px] ${
                                blocking
                                  ? 'border-red-400 bg-red-100 text-red-800'
                                  : warningOnly
                                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                                    : 'border-gray-300 bg-gray-50 text-gray-700'
                              }`}
                            >
                              {pin}
                              <button
                                type="button"
                                aria-label={`Retirer ${pin}`}
                                className="ml-0.5 leading-none opacity-60 hover:opacity-100"
                                onClick={() => removePin(index, pinIndex)}
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                        <input
                          className="min-w-16 flex-1 rounded border px-1 py-0.5 text-[10px]"
                          data-testid={`pin-add-${rowKey(row, index)}`}
                          aria-label={`Ajouter un pin au net ${row.name}`}
                          placeholder="+ REF.PIN"
                          value={pinDrafts[rowKey(row, index)] ?? ''}
                          onChange={(e) =>
                            setPinDrafts((prev) => ({
                              ...prev,
                              [rowKey(row, index)]: e.target.value,
                            }))
                          }
                          onBlur={() => addPins(index)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              addPins(index);
                            }
                          }}
                        />
                      </div>
                      {pinIssues.some(
                        (issue) =>
                          issue.net === row.name.trim() && issue.reason !== 'PAD_NOT_READABLE',
                      ) && (
                        <p className="mt-1 text-[10px] text-red-700">
                          {pinIssues
                            .filter(
                              (issue) =>
                                issue.net === row.name.trim() &&
                                issue.reason !== 'PAD_NOT_READABLE',
                            )
                            .map(pinIssueMessage)
                            .join(' · ')}
                        </p>
                      )}
                    </td>
                    <td className="border p-1 text-center">
                      <button
                        type="button"
                        title="Supprimer le net"
                        className="text-red-600"
                        onClick={() => setDraft((rows) => rows.filter((_, i) => i !== index))}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
                {draft.length === 0 && (
                  <tr>
                    <td colSpan={3} className="border p-3 text-center text-gray-500">
                      Aucun net — ajoutez-en un avec « + ».
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <button
              type="button"
              className="mt-2 rounded border px-2 py-1 text-xs"
              onClick={() => setDraft((rows) => [...rows, { id: '', name: '', pins: [] }])}
            >
              + Ajouter un net
            </button>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded border px-3 py-1 text-xs" onClick={onClose}>
                Annuler
              </button>
              <button
                type="button"
                className="rounded bg-blue-600 px-3 py-1 text-xs text-white disabled:opacity-50"
                onClick={save}
                disabled={saving}
              >
                {saving ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
