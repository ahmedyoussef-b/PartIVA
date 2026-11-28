'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cdcCategoryLabel } from '@/lib/pcb/cdc-gate';

interface Props {
  projectId: string;
  unconfirmed: number;
  categories: readonly string[];
  missingCategories: string[];
}

export function CdcCompletionActions({
  projectId,
  unconfirmed,
  categories,
  missingCategories,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState(missingCategories[0] ?? categories[0] ?? '');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const post = async (url: string, payload: Record<string, unknown>) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, ...payload }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  };

  const confirmAll = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const data = await post('/api/pcb/requirements/confirm-all', {});
      toast.success(`${data.confirmed as number} champ(s) confirmé(s).`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Confirmation impossible');
    } finally {
      setSaving(false);
    }
  };

  const addField = async () => {
    if (saving || !key.trim() || !value.trim()) return;
    setSaving(true);
    try {
      await post('/api/pcb/requirements/add', { category, key, value });
      toast.success(`Champ « ${key.trim()} » ajouté et confirmé.`);
      setKey('');
      setValue('');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ajout impossible');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-2 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
      <button
        type="button"
        onClick={() => void confirmAll()}
        disabled={saving || unconfirmed === 0}
        className="rounded border border-green-300 bg-white px-2 py-1 font-semibold text-green-700 disabled:opacity-50"
        title="Confirmer toutes les exigences proposées ou à vérifier"
      >
        {unconfirmed > 0 ? `Tout confirmer (${unconfirmed})` : 'Tout est confirmé'}
      </button>
      <div className="flex flex-wrap items-end gap-1">
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px]">Catégorie</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border px-1 py-1 text-xs"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {cdcCategoryLabel(c)}
                {missingCategories.includes(c) ? ' (manquante)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px]">Champ</span>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="ex. Quantité prévue"
            className="w-40 rounded border px-1 py-1 text-xs"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px]">Valeur</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ex. 100 cartes"
            className="w-48 rounded border px-1 py-1 text-xs"
          />
        </label>
        <button
          type="button"
          onClick={() => void addField()}
          disabled={saving || !key.trim() || !value.trim()}
          className="rounded bg-blue-600 px-2 py-1 font-medium text-white disabled:opacity-50"
        >
          + Ajouter un champ
        </button>
      </div>
    </div>
  );
}
