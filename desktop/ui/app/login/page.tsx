'use client';

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * E8P-S06 — Écran de login desktop (Bloc E — D-E8P-S06-2 = A).
 * invoke('login') → POST BetterAuth côté Rust → token extrait du Set-Cookie de session
 * et stocké immédiatement au keyring OS (jamais exposé au state JS — Sécurité #7).
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await invoke('login', { email, password });
      window.location.replace('/catalogue/');
    } catch {
      setError('Identifiants invalides ou service injoignable.');
      setBusy(false);
    }
  }

  return (
    <main className="center">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>Connexion PartIVA</h1>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="off"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </main>
  );
}
