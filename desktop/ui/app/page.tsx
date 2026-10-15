'use client';

import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * E8P-S06 — Point d'entrée desktop.
 * Token keyring présent → catalogue ; sinon → login.
 */
export default function Home() {
  useEffect(() => {
    (async () => {
      try {
        const token = await invoke<string | null>('load_token');
        window.location.replace(token ? '/catalogue/' : '/login/');
      } catch {
        window.location.replace('/login/');
      }
    })();
  }, []);

  return <main className="center">Chargement…</main>;
}
