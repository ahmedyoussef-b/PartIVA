'use client';

import { useState } from 'react';

export function PcbRollbackDialog({
  checkpointId,
  checkpointLabel,
  onConfirm,
  onCancel,
}: {
  checkpointId: string;
  checkpointLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pcb/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpointId }),
      });
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }
      onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold">Confirmer le rollback</h3>
        <p className="mt-2 text-sm text-gray-600">
          Revenir au checkpoint <strong>{checkpointLabel}</strong> ? Les modifications non
          sauvegardées seront perdues.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border px-4 py-2 text-sm"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Rollback...' : 'Confirmer le rollback'}
          </button>
        </div>
      </div>
    </div>
  );
}
