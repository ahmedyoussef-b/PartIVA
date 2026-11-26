'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function RequirementInput({
  projectId,
  kicadFilePath,
}: {
  projectId: string;
  partFunction?: string | null;
  kicadFilePath?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<'open' | 'reset' | null>(null);
  const hasFile = !!kicadFilePath?.trim();

  const run = async (action: 'open' | 'reset') => {
    try {
      setLoading(action);
      const res = await fetch(`/api/pcb/projects/${projectId}/board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      toast.success(
        action === 'open'
          ? 'Nouveau fichier KiCad créé'
          : `Plateau réinitialisé — composants, nets et validations effacés, CDC conservé${
              data.closedWindows > 0 ? ` · ${data.closedWindows} fenêtre(s) KiCad fermée(s)` : ''
            }`,
        { duration: 8_000 },
      );
      window.dispatchEvent(new Event('pcb:board-refresh'));
      window.dispatchEvent(new Event('pcb:sourcing-reset'));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-2 text-sm font-semibold text-gray-700">Cahier des charges</div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/admin/pcb/${projectId}/cahier-des-charges`}>
            Consulter cahier des charges
          </Link>
        </Button>
        {!hasFile ? (
          <Button size="sm" onClick={() => run('open')} disabled={loading !== null}>
            {loading === 'open' ? 'Ouverture…' : 'Ouvrir un nouveau fichier'}
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => run('reset')}
              disabled={loading !== null}
            >
              {loading === 'reset' ? 'Réinitialisation…' : 'Reset'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
