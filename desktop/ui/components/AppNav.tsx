'use client';

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import SyncStatus from '@/components/SyncStatus';

/**
 * E8P-S09-quater-ter — Barre de navigation desktop, affichée UNIQUEMENT
 * après authentification (token keyring présent). Avant login : aucune navbar
 * (écran de connexion épuré) + pas de badge de sync sans session.
 */
export default function AppNav() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await invoke<string | null>('load_token');
        setAuthed(Boolean(token));
      } catch {
        setAuthed(false);
      }
    })();
  }, []);

  if (!authed) return null;

  return (
    <header className="app-header">
      <span className="app-title">PartIVA Desktop</span>
      <nav>
        <a href="/catalogue/">Catalogue</a>
        <a href="/recherche/">Recherche</a>
      </nav>
      <SyncStatus />
    </header>
  );
}
