'use client';

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * E8P-S06 — Écran de login desktop (Bloc E — D-E8P-S06-2 = A).
 * E8P-S09-bis — deux correctifs :
 *  1. Anti-autofill (readOnly retiré au focus) : les champs sont CONTRÔLÉS
 *     (value/onChange) — l'autofill navigateur ne déclenche pas onChange, le
 *     state restait vide et le login envoyait un mot de passe vide.
 *  2. Affichage de l'erreur RÉELLE renvoyée par Rust (message détaillé de auth.rs)
 *     au lieu d'un message générique.
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
      await invoke('login', { email: email.trim(), password });
      window.location.replace('/catalogue/');
    } catch (err) {
      setError(String(err ?? 'Connexion impossible'));
      setBusy(false);
    }
  }

  return (
    <main className="center">
      <form className="login-card" onSubmit={onSubmit} autoComplete="off">
        <h1>Connexion PartIVA</h1>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            readOnly
            onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            readOnly
            onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
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
