'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface CatalogRow {
  catalogId: string;
  name: string;
  type: string | null;
  category: string;
  footprint: string;
  supplierRef: string;
  price: number | null;
  currency: string | null;
  stock: number;
  stockStatus: string | null;
  updatedAt: string | null;
}

export default function CatalogAuditTable() {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [saving, setSaving] = useState(false);
  const [collapsedNames, setCollapsedNames] = useState<Set<string>>(new Set());
  const [collapsedTypes, setCollapsedTypes] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    type: '',
    category: '',
    footprint: '',
    symbol: '',
    supplier: '',
    supplierRef: '',
    price: '',
  });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteByName = async (name: string) => {
    if (!confirm(`Supprimer tous les composants nommés "${name}" ?`)) return;
    setDeleting(true);
    try {
      await fetch('/api/pcb/sourcing/audit', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      await load();
    } finally {
      setDeleting(false);
    }
  };
  const deleteByType = async (type: string) => {
    if (!confirm(`Supprimer tous les composants de type "${type}" ?`)) return;
    setDeleting(true);
    try {
      await fetch('/api/pcb/sourcing/audit', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      await load();
    } finally {
      setDeleting(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pcb/sourcing/audit');
      if (!res.ok) throw new Error(`Erreur API (${res.status})`);
      const json = (await res.json()) as { data: CatalogRow[] };
      setRows(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/pcb/sourcing/audit');
        if (!res.ok) throw new Error(`Erreur API (${res.status})`);
        const json = (await res.json()) as { data: CatalogRow[] };
        if (mounted) setRows(json.data ?? []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = rows.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.type ?? '').toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      (r.supplierRef ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = new Map<string, Map<string, Map<string, CatalogRow[]>>>();
  for (const r of filtered) {
    const name = r.name || 'Sans nom';
    const type = r.type || 'Sans type';
    const category = r.category || 'Sans catégorie';
    if (!grouped.has(name)) grouped.set(name, new Map());
    const byType = grouped.get(name)!;
    if (!byType.has(type)) byType.set(type, new Map());
    const byCat = byType.get(type)!;
    if (!byCat.has(category)) byCat.set(category, []);
    byCat.get(category)!.push(r);
  }

  const toggleName = (name: string) => {
    setCollapsedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };
  const toggleType = (key: string) => {
    setCollapsedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async (id: string) => {
    const row = rows.find((r) => r.catalogId === id);
    if (!row) return;
    const entered = parseFloat(editPrice);
    if (isNaN(entered) || entered <= 0) {
      alert('Prix invalide');
      return;
    }
    const price = entered;
    const stockNum = parseInt(editStock, 10);
    const stockStatus = isNaN(stockNum) || stockNum >= 50 ? 'in_stock' : 'low_stock';
    setSaving(true);
    try {
      await fetch('/api/pcb/catalog/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalogId: id,
          price,
          stock: stockNum,
          stockStatus,
          currency: 'TND',
        }),
      });
      setRows((prev) =>
        prev.map((r) =>
          r.catalogId === id
            ? {
                ...r,
                price,
                currency: 'TND',
                stock: stockNum,
                stockStatus,
                updatedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const submitAdd = async () => {
    if (!addForm.name.trim() || !addForm.category.trim()) {
      alert('Nom et catégorie requis');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/pcb/sourcing/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name.trim(),
          type: addForm.type.trim() || null,
          category: addForm.category.trim(),
          footprint: addForm.footprint.trim(),
          symbol: addForm.symbol.trim() || addForm.name.trim(),
          supplier: addForm.supplier.trim() || undefined,
          supplierRef: addForm.supplierRef.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || json.error) throw new Error(json.error || 'Erreur');
      if (addForm.price.trim() && json.id) {
        const price = parseFloat(addForm.price);
        if (!isNaN(price) && price > 0) {
          await fetch('/api/pcb/catalog/price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ catalogId: json.id, price, currency: 'TND' }),
          });
        }
      }
      setAddForm({
        name: '',
        type: '',
        category: '',
        footprint: '',
        symbol: '',
        supplier: '',
        supplierRef: '',
        price: '',
      });
      setShowAdd(false);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Rechercher un composant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded border p-2 text-sm"
        />
        <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? 'Annuler' : '+ Ajouter un composant'}
        </Button>
      </div>

      {showAdd && (
        <div className="space-y-2 rounded-lg border bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-2">
            <input
              className="rounded border p-2 text-sm"
              placeholder="Nom (ex. Condensateur)"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            />
            <input
              className="rounded border p-2 text-sm"
              placeholder="Type (ex. céramique)"
              value={addForm.type}
              onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
            />
            <input
              className="rounded border p-2 text-sm"
              placeholder="Catégorie"
              value={addForm.category}
              onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
            />
            <input
              className="rounded border p-2 text-sm"
              placeholder="Footprint"
              value={addForm.footprint}
              onChange={(e) => setAddForm({ ...addForm, footprint: e.target.value })}
            />
            <input
              className="rounded border p-2 text-sm"
              placeholder="Symbole"
              value={addForm.symbol}
              onChange={(e) => setAddForm({ ...addForm, symbol: e.target.value })}
            />
            <input
              className="rounded border p-2 text-sm"
              placeholder="Fournisseur"
              value={addForm.supplier}
              onChange={(e) => setAddForm({ ...addForm, supplier: e.target.value })}
            />
            <input
              className="rounded border p-2 text-sm"
              placeholder="Réf. fournisseur"
              value={addForm.supplierRef}
              onChange={(e) => setAddForm({ ...addForm, supplierRef: e.target.value })}
            />
            <input
              className="rounded border p-2 text-sm"
              placeholder="Prix (optionnel)"
              value={addForm.price}
              onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
            />
          </div>
          <Button size="sm" onClick={submitAdd} disabled={adding}>
            {adding ? '…' : 'Ajouter'}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {Array.from(grouped.entries()).map(([name, byType]) => {
          const nameCollapsed = collapsedNames.has(name);
          return (
            <div key={name} className="overflow-hidden rounded-lg border bg-white">
              <div className="flex w-full items-center justify-between border-b bg-gray-50 px-4 py-2">
                <button
                  type="button"
                  onClick={() => toggleName(name)}
                  className="text-sm font-semibold text-gray-700"
                >
                  {name} <span className="text-xs text-gray-400">{nameCollapsed ? '▸' : '▾'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteByName(name)}
                  disabled={deleting}
                  className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Supprimer le nom
                </button>
              </div>
              {!nameCollapsed && (
                <div className="space-y-2 p-3">
                  {Array.from(byType.entries()).map(([type, byCat]) => {
                    const typeKey = `${name}::${type}`;
                    const typeCollapsed = collapsedTypes.has(typeKey);
                    return (
                      <div key={type} className="rounded border">
                        <div className="flex w-full items-center justify-between bg-gray-100 px-3 py-1.5">
                          <button
                            type="button"
                            onClick={() => toggleType(typeKey)}
                            className="text-xs font-semibold text-gray-600"
                          >
                            {type} {typeCollapsed ? '▸' : '▾'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteByType(type)}
                            disabled={deleting}
                            className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            Supprimer le type
                          </button>
                        </div>
                        {!typeCollapsed && (
                          <div className="space-y-2 p-2">
                            {Array.from(byCat.entries()).map(([category, items]) => (
                              <div key={category}>
                                <div className="mb-1 text-xs font-medium text-gray-500">
                                  {category}
                                </div>
                                <div className="overflow-x-auto rounded border">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50 text-gray-600 uppercase">
                                      <tr>
                                        <th className="px-2 py-1">Nom</th>
                                        <th className="px-2 py-1 text-right">Prix</th>
                                        <th className="px-2 py-1 text-right">Stock</th>
                                        <th className="px-2 py-1">Mis à jour</th>
                                        <th className="px-2 py-1">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {items.map((r) => (
                                        <tr key={r.catalogId}>
                                          <td className="px-2 py-1">{r.name}</td>
                                          <td className="px-2 py-1 text-right font-mono">
                                            {editingId === r.catalogId ? (
                                              <input
                                                type="number"
                                                step="0.01"
                                                value={editPrice}
                                                onChange={(e) => setEditPrice(e.target.value)}
                                                className="w-16 rounded border p-1 text-right"
                                              />
                                            ) : (
                                              `${r.price != null ? (r.currency === 'EUR' ? (r.price * 3.3).toFixed(2) : r.price.toFixed(2)) : '—'} ${r.currency === 'EUR' ? 'DT' : (r.currency ?? 'DT')}`
                                            )}
                                          </td>
                                          <td className="px-2 py-1 text-right font-mono">
                                            {editingId === r.catalogId ? (
                                              <input
                                                type="number"
                                                step="1"
                                                value={editStock}
                                                onChange={(e) => setEditStock(e.target.value)}
                                                className="w-12 rounded border p-1 text-right"
                                              />
                                            ) : (
                                              r.stock
                                            )}
                                          </td>
                                          <td className="px-2 py-1 text-xs text-gray-500">
                                            {formatDate(r.updatedAt)}
                                          </td>
                                          <td className="px-2 py-1">
                                            {editingId === r.catalogId ? (
                                              <Button
                                                size="sm"
                                                onClick={() => save(r.catalogId)}
                                                disabled={saving}
                                              >
                                                {saving ? '…' : 'OK'}
                                              </Button>
                                            ) : (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  setEditingId(r.catalogId);
                                                  setEditPrice(
                                                    String(
                                                      r.price != null
                                                        ? r.currency === 'EUR'
                                                          ? r.price * 3.3
                                                          : r.price
                                                        : '',
                                                    ),
                                                  );
                                                  setEditStock(String(r.stock));
                                                }}
                                              >
                                                Éditer
                                              </Button>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
