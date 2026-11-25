'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  projectId: string;
  requirement: {
    id: string;
    key: string;
    value: string;
    source: string | null;
    status: string;
  };
}

export function RequirementValueEditor({ projectId, requirement }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(requirement.value);
  const [saving, setSaving] = useState(false);

  const save = async (value: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/pcb/requirements/technical-field', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          requirementId: requirement.id,
          field: requirement.key,
          value,
          source: 'manual',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `Erreur ${res.status}`);
      toast.success(`Champ « ${requirement.key} » validé`);
      setEditing(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sauvegarde impossible');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <dd className="flex-1">
        <textarea
          className="w-full rounded border p-1 text-sm"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            disabled={saving || !draft.trim()}
            className="rounded bg-green-600 px-2 py-0.5 text-[11px] text-white"
            onClick={() => void save(draft.trim())}
          >
            {saving ? '…' : 'Enregistrer et valider'}
          </button>
          <button
            type="button"
            className="rounded border px-2 py-0.5 text-[11px]"
            onClick={() => setEditing(false)}
          >
            Annuler
          </button>
        </div>
      </dd>
    );
  }

  return (
    <dd className="flex-1 text-sm whitespace-pre-wrap text-gray-800">
      <span>{requirement.value}</span>
      {requirement.source && (
        <span className="mt-0.5 block text-xs text-muted-foreground italic">
          Source : {requirement.source.slice(0, 120)}
        </span>
      )}
      <span className="ml-2 inline-flex gap-1 align-middle">
        <button
          type="button"
          title="Modifier cette valeur"
          className="rounded border px-1 text-[10px] text-gray-600"
          onClick={() => {
            setDraft(requirement.value);
            setEditing(true);
          }}
        >
          ✎
        </button>
        {requirement.status !== 'confirmed' && (
          <button
            type="button"
            title="Valider cette valeur telle quelle"
            disabled={saving}
            className="rounded border border-green-300 px-1 text-[10px] text-green-700"
            onClick={() => void save(requirement.value)}
          >
            ✓
          </button>
        )}
      </span>
    </dd>
  );
}
