'use client';

import { useEffect, useState } from 'react';
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

/**
 * E8P-S06 — Écran catalogue (Bloc F) : lecture locale SQLite via invoke('list_parts').
 * Données issues de la sync web → local (lecture seule, D-E8P-S01-2).
 */
export default function CataloguePage() {
  const [parts, setParts] = useState<PartRow[]>([]);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const limit = 50;

  useEffect(() => {
    (async () => {
      try {
        const rows = await invoke<PartRow[]>('list_parts', { limit, offset });
        setParts(rows);
      } catch {
        setError('Catalogue indisponible — lancez une sync.');
      }
    })();
  }, [offset]);

  return (
    <main>
      <h1>Catalogue</h1>
      {error && <p className="error">{error}</p>}
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
        </tbody>
      </table>
      <div className="pagination">
        <button onClick={() => setOffset((o) => Math.max(0, o - limit))} disabled={offset === 0}>
          Précédent
        </button>
        <button onClick={() => setOffset((o) => o + limit)} disabled={parts.length < limit}>
          Suivant
        </button>
      </div>
    </main>
  );
}
