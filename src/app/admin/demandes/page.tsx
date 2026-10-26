'use client';

import * as React from 'react';
import { getDemandesFile } from '@/lib/data-client';
import { mapRequestToUi } from '@/lib/utils/request-mappers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthGuard from '@/lib/auth-guard';

function AdminDemandesPageContent() {
  const [demandes, setDemandes] = React.useState<ReturnType<typeof mapRequestToUi>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    async function fetchDemandes() {
      try {
        const data = await getDemandesFile();
        const mapped = (data || []).map(mapRequestToUi);
        setDemandes(mapped);
      } catch (error) {
        console.error('Failed to fetch demandes:', error);
        setDemandes([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDemandes();
  }, []);

  const filtered = demandes.filter((d) => {
    const q = query.toLowerCase();
    return (
      d.partDescription?.toLowerCase().includes(q) ||
      d.machineRef?.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q) ||
      d.urgency.toLowerCase().includes(q)
    );
  });

  const STATUS_CONFIG: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
  > = {
    new: { label: 'Nouvelle', variant: 'outline' },
    searching: { label: 'Recherche', variant: 'default' },
    candidate_found: { label: 'Candidat trouvé', variant: 'secondary' },
    reverse_engineering: { label: 'Reverse CAO', variant: 'default' },
    machining: { label: 'Usinage', variant: 'default' },
    completed: { label: 'Terminée', variant: 'default' },
    rejected: { label: 'Rejetée', variant: 'destructive' },
  };

  const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
    low: { label: 'Faible', color: 'text-blue-600' },
    normal: { label: 'Normale', color: 'text-amber-600' },
    high: { label: 'Haute', color: 'text-orange-600' },
    critical: { label: 'Critique', color: 'text-red-600' },
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            File de fabrication
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Demandes reçues → Recherche matériaux → Validation → Usinage CNC.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
        <Input
          placeholder="Filtrer les demandes…"
          className="pl-9 text-xs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4" />
            {filtered.length} demande(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm">Chargement...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">Aucune demande</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((d) => {
                const statusCfg = STATUS_CONFIG[d.status] || {
                  label: d.status,
                  variant: 'outline',
                };
                const urgencyCfg = URGENCY_CONFIG[d.urgency] || {
                  label: d.urgency,
                  color: 'text-muted-foreground',
                };
                return (
                  <div
                    key={d.id}
                    className="border-border hover:bg-muted/30 flex items-start gap-3 rounded-lg border p-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[9px]">
                          {d.id.slice(0, 8)}
                        </Badge>
                        <Badge variant={statusCfg.variant} className="text-[9px]">
                          {statusCfg.label}
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] ${urgencyCfg.color}`}>
                          {urgencyCfg.label}
                        </Badge>
                      </div>
                      <p className="truncate text-xs font-medium">{d.partDescription}</p>
                      {d.partFunction && (
                        <p className="text-muted-foreground mt-0.5 truncate text-[10px]">
                          Fonction : {d.partFunction}
                        </p>
                      )}
                      <p className="text-muted-foreground mt-1 flex items-center gap-1 text-[10px]">
                        {d.machineRef && (
                          <>
                            <span>Machine :</span>
                            <span className="font-mono">{d.machineRef}</span>
                            <span>·</span>
                          </>
                        )}
                        <span>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</span>
                        {d.client?.name && (
                          <>
                            <span>·</span>
                            <span>Client : {d.client.name}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDemandesPage() {
  return (
    <AuthGuard>
      <AdminDemandesPageContent />
    </AuthGuard>
  );
}


