'use client';

import { useEffect, useState } from 'react';

interface KicadIpcInfo {
  available: boolean;
  socketPath: string | null;
  version: string | null;
}

export function KiCadStatus() {
  const [info, setInfo] = useState<KicadIpcInfo | null>(null);
  const [loading, setLoading] = useState(true);

  async function detect() {
    try {
      const res = await fetch('/api/pcb/ipc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detect' }),
      });
      const data = (await res.json()) as KicadIpcInfo;
      setInfo(data);
    } catch {
      setInfo({ available: false, socketPath: null, version: null });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/pcb/ipc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'detect' }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: KicadIpcInfo) => setInfo(data))
      .catch(() => setInfo({ available: false, socketPath: null, version: null }))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="rounded border bg-gray-50 p-3 text-sm text-gray-500">
        Détection de KiCad...
      </div>
    );
  }

  if (!info || !info.available) {
    return (
      <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
        <p className="font-semibold text-amber-800">KiCad GUI non détecté</p>
        <p className="mt-1 text-amber-700">
          Ouvrez KiCad et chargez un projet pour activer la connexion IPC.
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            detect();
          }}
          className="mt-2 rounded border px-3 py-1 text-xs"
          disabled={loading}
        >
          {loading ? 'Détection...' : 'Détecter à nouveau'}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded border border-green-300 bg-green-50 p-3 text-sm">
      <p className="font-semibold text-green-800">KiCad GUI connecté</p>
      <p className="mt-1 text-green-700">
        Version : {info.version ?? 'inconnue'} | Socket : {info.socketPath ?? 'N/A'}
      </p>
      <button
        type="button"
        onClick={() => {
          setLoading(true);
          detect();
        }}
        className="mt-2 rounded border px-3 py-1 text-xs"
        disabled={loading}
      >
        {loading ? 'Détection...' : 'Rafraîchir'}
      </button>
    </div>
  );
}
