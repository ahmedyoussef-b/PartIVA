'use client';

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

type PartRow = {
  id: string;
  part_number: string;
  name: string;
  category_id: string | null;
  material: string | null;
  status: string;
  updated_at: string;
};

const MODES = [
  { value: 'reference', label: 'Référence' },
  { value: 'name', label: 'Nom' },
  { value: 'category', label: 'Catégorie' },
  { value: 'material', label: 'Matière' },
  { value: 'vehicle', label: 'Véhicule' },
  { value: 'specs', label: 'Spécifications' },
];

/**
 * E8P-S06 — Écran recherche (Bloc G) : 6 modes locaux (réplique des modes web),
 * exécutés en SQL sur la base locale via invoke('search_parts').
 */
export default function RecherchePage() {
  const [mode, setMode] = useState('reference');
  const [query, setQuery] = useState('');
  const [parts, setParts] = useState<PartRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const rows = await invoke<PartRow[]>('search_parts', { mode, query });
      setParts(rows);
    } catch {
      setError('Recherche échouée.');
      setParts(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>Recherche</h1>
      <form className="search-bar" onSubmit={onSearch}>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Terme de recherche…"
        />
        <button type="submit" disabled={busy}>
          {busy ? 'Recherche…' : 'Chercher'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {parts && (
        <table className="parts-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Nom</th>
              <th>Matière</th>
              <th>Statut</th>
              <th>Maj</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p.id}>
                <td>
                  <a href={`/part/?id=${encodeURIComponent(p.id)}`}>{p.part_number}</a>
                </td>
                <td>{p.name}</td>
                <td>{p.material ?? '—'}</td>
                <td>{p.status}</td>
                <td>{p.updated_at?.slice(0, 10)}</td>
              </tr>
            ))}
            {parts.length === 0 && (
              <tr>
                <td colSpan={5}>Aucun résultat.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}
