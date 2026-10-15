'use client';

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

type SyncState = 'idle' | 'syncing' | 'ok' | 'error' | 'not-authenticated';

/**
 * E8P-S06 — Indicateur d'état de sync (Bloc I).
 * Au montage : charge le token keyring ; si présent, déclenche sync_now en arrière-plan (non bloquant).
 */
export default function SyncStatus() {
  const [state, setState] = useState<SyncState>('idle');
  const [detail, setDetail] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await invoke<string | null>('load_token');
        if (!token) {
          if (!cancelled) setState('not-authenticated');
          return;
        }
        if (cancelled) return;
        setState('syncing');
        const summary = await invoke<{
          tables_synced: number;
          rows_total: number;
          duration_ms: number;
        }>('sync_now');
        if (cancelled) return;
        setState('ok');
        setDetail(
          `${summary.tables_synced} tables · ${summary.rows_total} lignes · ${summary.duration_ms} ms`,
        );
      } catch {
        if (!cancelled) {
          setState('error');
          setDetail('Sync échouée — données locales conservées');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const label: Record<SyncState, string> = {
    idle: 'Sync : initialisation',
    syncing: 'Sync en cours…',
    ok: 'Sync à jour',
    error: 'Sync en erreur',
    'not-authenticated': 'Non connecté',
  };

  return (
    <span className="sync-status-wrap">
      <span className={`sync-status sync-${state}`}>{label[state]}</span>
      {/* E8P-S09-quater-ter — le détail de l'erreur est affiché (diagnostic F12
          impossible sur toutes les machines) au lieu d'un simple title. */}
      {state === 'error' && detail ? <span className="sync-detail">{detail}</span> : null}
    </span>
  );
}
