'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface PcbRequirementItem {
  id: string;
  partDescription: string;
  status: string;
  createdAt: string;
  client?: { name: string | null; email: string | null } | null;
}

export default function PcbRequirementsListPage() {
  const [requirements, setRequirements] = useState<PcbRequirementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.info('[DASHBOARD:UI] Liste des cahiers des charges PCB chargée');
    let mounted = true;

    async function fetchRequirements() {
      try {
        const res = await fetch('/api/pcb/requirements');
        if (!res.ok) throw new Error(`Erreur API (${res.status})`);
        const json = (await res.json()) as { data: PcbRequirementItem[] };
        if (mounted) setRequirements(json.data ?? []);
      } catch (err) {
        console.error('[DASHBOARD:UI] Échec de chargement des cahiers des charges PCB', err);
        if (mounted) setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRequirements();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Cahiers des charges PCB</h1>
      <p className="mb-6 text-muted-foreground">Liste des cahiers des charges reçus.</p>

      {loading ? (
        <div className="text-sm text-muted-foreground">Chargement...</div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <strong>Erreur :</strong> {error}
        </div>
      ) : requirements.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Aucun cahier des charges PCB reçu.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2 font-mono text-xs">{r.id.slice(0, 8)}</td>
                  <td className="px-4 py-2">{r.partDescription || '—'}</td>
                  <td className="px-4 py-2">{r.client?.name || r.client?.email || '—'}</td>
                  <td className="px-4 py-2">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/pcb/requirements/${r.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Détails
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
          ← Retour au Dashboard
        </Link>
      </div>
    </div>
  );
}
