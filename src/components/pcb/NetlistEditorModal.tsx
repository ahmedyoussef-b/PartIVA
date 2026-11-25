'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(true); // charge au montage (useEffect plus bas)
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/pcb/requirements/nets?projectId=${encodeURIComponent(projectId)}`,
        );
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || `Erreur ${res.status}`);
        if (cancelled) return;
        setOriginal(data.nets as NetRow[]);
        setDraft(data.nets as NetRow[]);
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
  }, [projectId]);

  const updateRow = (index: number, patch: Partial<NetRow>) => {
    setDraft((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const save = async () => {
    const seen = new Set<string>();
    for (const row of draft) {
      const name = row.name.trim();
      if (!name) {
        toast.error('Tous les nets doivent avoir un nom');
        return;
      }
      if (seen.has(name)) {
        toast.error(`Net en double : ${name}`);
        return;
      }
      seen.add(name);
    }

    setSaving(true);
    try {
      const originalById = new Map(original.map((n) => [n.id, n]));
      const draftIds = new Set(draft.filter((n) => n.id).map((n) => n.id));

      for (const row of draft) {
        const before = row.id ? originalById.get(row.id) : undefined;
        const pinsChanged =
          !before ||
          JSON.stringify([...before.pins].sort()) !== JSON.stringify([...row.pins].sort());
        if (!row.id || !before) {
          await patch({ action: 'add', net: { name: row.name.trim(), pins: row.pins } });
        } else if (pinsChanged || before.name !== row.name.trim()) {
          await patch({
            action: 'update',
            oldName: before.name,
            net: { name: row.name.trim(), pins: row.pins },
          });
        }
      }
      for (const before of original) {
        if (!draftIds.has(before.id)) {
          await patch({ action: 'delete', net: { name: before.name } });
        }
      }

      toast.success(`${draft.length} net(s) sauvegardés`);
      onSaved(draft.length);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sauvegarde impossible');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/pcb/requirements/nets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, ...payload }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || `Erreur ${res.status}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg border bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Édition de la netlist</h3>
          <button type="button" className="text-sm text-gray-500" onClick={onClose}>
            ✕
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : (
          <>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="border p-2">Nom du net</th>
                  <th className="border p-2">Pins (séparés par des virgules)</th>
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
                      <input
                        className="w-full rounded border px-1 py-0.5"
                        value={row.pins.join(', ')}
                        onChange={(e) =>
                          updateRow(index, {
                            pins: e.target.value
                              .split(',')
                              .map((p) => p.trim())
                              .filter(Boolean),
                          })
                        }
                      />
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
