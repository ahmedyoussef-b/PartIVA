import type { Machine } from '@/generated/prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key } from 'lucide-react';
import { recommendMachine } from '@/lib/utils/machine-recommendation';

type MachineRecommendationPanelProps = {
  part: {
    material?: string | null;
    autoCategory?: string | null;
    machineId?: string | null;
    specifications?: { key: string; value: string }[];
  };
  machines: Machine[];
};

export const MachineRecommendationPanel = ({ part, machines }: MachineRecommendationPanelProps) => {
  const result = recommendMachine({ part, machines });

  if (result.alreadyAssigned) {
    return (
      <div className="mt-4">
        <Badge variant="secondary">Déjà assignée à {result.machine?.name}</Badge>
        <Button
          variant="ghost"
          className="mt-2 text-sm"
          onClick={() => window.location.href = `/admin/machines/${result.machine?.id}`}
        >
          Voir la machine
        </Button>
      </div>
    );
  }

  if (!result.machine) {
    return (
      <div className="mt-4 text-sm text-muted-foreground">
        Aucune recommandation disponible pour cette pièce
      </div>
    );
  }

  const scoreColor = result.score === 'haute' ? 'bg-green-100 text-green-800' : result.score === 'moyenne' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800';

  return (
    <div className="mt-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recommandation de machine</CardTitle>
          <CardDescription className="text-xs">
            {result.reasons.map((reason) => (
              <Key className="mb-1" key={reason}>
                {reason}
              </Key>
            ))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            <div className="flex items-baseline justify-between gap-4 py-2">
              <dt className="text-xs font-medium text-muted-foreground">Machine</dt>
              <dd className="font-mono text-sm">{result.machine?.name}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-2">
              <dt className="text-xs font-medium text-muted-foreground">Type</dt>
              <dd className="font-mono text-sm">{result.machine?.type}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-2">
              <dt className="text-xs font-medium text-muted-foreground">Statut</dt>
              <dd>
                <Badge
                  variant={result.machine?.status === 'IDLE' ? 'outline' : 'secondary'}
                >
                  {result.machine?.status}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <div className="mt-3">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => window.location.href = `/admin/machines/${result.machine?.id}`}
        >
          Voir la machine détaillée
        </Button>
      </div>
    </div>
  );
};