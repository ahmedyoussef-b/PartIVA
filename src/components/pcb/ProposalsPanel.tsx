'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export interface SerializedProposal {
  id: string;
  action: string;
  target: string;
  payload: unknown;
  reason: string | null;
  status: string;
}

export function ProposalsPanel({
  proposals,
}: {
  projectId: string;
  proposals: SerializedProposal[];
}) {
  const router = useRouter();
  const [resolving, setResolving] = useState<string | null>(null);

  if (proposals.length === 0) return null;

  const handleDecision = async (id: string, status: 'accepted' | 'rejected') => {
    setResolving(id);
    try {
      const res = await fetch(`/api/pcb/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? data.message ?? 'Erreur');
        return;
      }
      toast.success(status === 'accepted' ? 'Proposition acceptée' : 'Proposition rejetée');
      if (data.applicationError) {
        toast.error(`Application partielle : ${data.applicationError}`);
      }
      router.refresh();
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setResolving(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Propositions IA ({proposals.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {proposals.map((p) => (
          <div key={p.id} className="rounded border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline">{p.action}</Badge>
              <span className="text-xs text-gray-500">{p.target}</span>
            </div>
            {p.reason && <p className="mt-1 text-xs text-gray-600">{p.reason}</p>}
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-gray-50 p-2 text-[10px]">
              {JSON.stringify(p.payload, null, 2)}
            </pre>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                disabled={resolving === p.id}
                onClick={() => handleDecision(p.id, 'accepted')}
              >
                {resolving === p.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Check className="mr-1 h-3 w-3" />
                )}
                Accepter
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={resolving === p.id}
                onClick={() => handleDecision(p.id, 'rejected')}
              >
                <X className="mr-1 h-3 w-3" />
                Rejeter
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}