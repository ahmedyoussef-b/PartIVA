'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cdcCategoryLabel } from '@/lib/pcb/cdc-gate';

interface Props {
  projectId: string;
  ready: boolean;
  reason: string;
  missing: string[];
  canFinalize: boolean;
  redirected: boolean;
}

export function CdcGateActions({
  projectId,
  ready,
  reason,
  missing,
  canFinalize,
  redirected,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const finalize = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/pcb/requirements/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok)
        throw new Error(data.message || data.error || `Erreur ${res.status}`);
      toast.success('Cahier des charges validé — vous pouvez passer au layout.');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Validation impossible');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {canFinalize && (
          <button
            type="button"
            onClick={() => void finalize()}
            disabled={saving}
            className="rounded border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 disabled:opacity-50"
          >
            {saving ? 'Validation…' : 'Valider le CDC complet'}
          </button>
        )}
        <button
          type="button"
          disabled={!ready}
          title={ready ? 'Ouvrir le layout PCB' : reason}
          onClick={() => router.push(`/admin/pcb/${projectId}`)}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
        >
          Passer au Layout PCB
        </button>
      </div>
      {redirected && (
        <p className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
          Veuillez compléter l&apos;analyse du CDC avant de passer au layout.
        </p>
      )}
      {!ready && missing.length > 0 && (
        <p className="text-[10px] text-amber-700">
          Manquant : {missing.map(cdcCategoryLabel).join(', ')}
        </p>
      )}
    </div>
  );
}
