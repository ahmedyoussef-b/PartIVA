'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Archive } from 'lucide-react';
import { toast } from 'sonner';

export function CapitalizeButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [regime, setRegime] = React.useState<'internal' | 'reference'>('internal');
  const [licence, setLicence] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [result, setResult] = React.useState<{
    checkpointId: string;
    components: number;
    acceptedProposals: number;
  } | null>(null);

  const blocked = saving || (regime === 'reference' && licence.trim() === '');

  const handleCapitalize = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pcb/capitalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          regime,
          licence: regime === 'reference' ? licence.trim() : null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur');
        return;
      }

      toast.success('Projet capitalisé');
      setResult({
        checkpointId: data.checkpointId,
        components: data.components ?? 0,
        acceptedProposals: data.acceptedProposals ?? 0,
      });
      router.refresh();
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Archive className="h-4 w-4 text-primary" />
          Capitalisation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <select
          value={regime}
          onChange={(e) => setRegime(e.target.value === 'reference' ? 'reference' : 'internal')}
          className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="internal">Projet interne</option>
          <option value="reference">Modèle de référence</option>
        </select>

        {regime === 'reference' && (
          <input
            type="text"
            value={licence}
            onChange={(e) => setLicence(e.target.value)}
            placeholder="Licence (ex. CERN-OHL-S-2.0)"
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
          />
        )}

        <Button size="sm" disabled={blocked} onClick={handleCapitalize}>
          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Capitaliser
        </Button>

        {result && (
          <p className="text-xs text-green-700">
            Fiche enregistrée ({result.components} composants, {result.acceptedProposals}{' '}
            propositions)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
