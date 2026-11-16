'use client';

import { useState } from 'react';
import type { CatalogComponent } from '@/lib/pcb/catalog';

export function CatalogTable({ initial }: { initial: CatalogComponent[] }) {
  const [rows, setRows] = useState(initial);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');

  const filtered = rows.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()),
  );

  async function savePrice(id: string) {
    const price = parseFloat(editPrice);
    if (isNaN(price)) return;
    await fetch('/api/pcb/catalog/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalogId: id, price }),
    });
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, price } : r)));
    setEditingId(null);
    setEditPrice('');
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Rechercher un composant..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded border p-2"
      />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Nom</th>
            <th className="p-2">Catégorie</th>
            <th className="p-2">Prix</th>
            <th className="p-2">Fournisseur</th>
            <th className="p-2">Stock</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-2">{r.name}</td>
              <td className="p-2">{r.category}</td>
              <td className="p-2">
                {editingId === r.id ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-20 rounded border p-1"
                  />
                ) : (
                  `${r.price ?? '—'} ${r.currency ?? ''}`
                )}
              </td>
              <td className="p-2">{r.supplier ?? '—'}</td>
              <td className="p-2">{r.stockStatus ?? '—'}</td>
              <td className="p-2">
                {editingId === r.id ? (
                  <button
                    type="button"
                    onClick={() => savePrice(r.id)}
                    className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                  >
                    Enregistrer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(r.id);
                      setEditPrice(String(r.price ?? ''));
                    }}
                    className="rounded border px-2 py-1 text-xs"
                  >
                    Éditer prix
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
