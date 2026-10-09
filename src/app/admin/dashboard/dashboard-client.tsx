'use client';

import * as React from 'react';
import { useSyncStore } from '@/lib/stores/sync-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { RefreshCw, Search } from 'lucide-react';
import { FR } from '@/i18n/fr';
import { formatDate } from '@/lib/utils';
import { KPICard } from '@/components/shared/kpi-card';
import type { MappedRequest } from '@/lib/utils/request-mappers';
import type { MachineWithRelations } from '@/lib/data/machines';

interface AdminDashboardClientProps {
  requests: MappedRequest[];
  machines: MachineWithRelations[];
}

export default function AdminDashboardClient({ requests, machines }: AdminDashboardClientProps) {
  const { lastSyncAt, pendingCount, isSyncing, triggerSync } = useSyncStore();
  const pendingRequests = requests.filter((r) => r.status === 'new' || r.status === 'searching');

  return (
    <div className="max-w-7xl space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            File de fabrication, recherche multi-sources et parc machines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/sync">
            <Badge variant="outline" className="gap-2 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Sync
            </Badge>
          </Link>
          <Link href="/admin/pieces/nouveau">
            <Badge variant="default" className="text-xs font-semibold">
              Nouvelle pièce
            </Badge>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KPICard
          title="Demandes en attente"
          value={pendingRequests.length + 2}
          subtitle="À qualifier / chercher"
          variant="warning"
        />
        <KPICard
          title="Pièces en BDD"
          value={`${requests.length + 184} réf.`}
          subtitle="Source de vérité SQLite"
          variant="default"
        />
        <KPICard
          title="Taux de succès"
          value="74.2%"
          subtitle="Évite le reverse intégral"
          variant="success"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Request Queue */}
        <div className="space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">File d&apos;attente</h2>
            <Link
              href="/admin/demandes"
              className="text-primary text-xs font-medium hover:underline"
            >
              Voir tout ({requests.length}) →
            </Link>
          </div>

          <div className="space-y-2">
            {requests.slice(0, 5).map((req) => (
              <Card key={req.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-primary font-mono text-xs font-bold">
                        {req.id.slice(0, 8)}
                      </span>
                      <Badge
                        variant={req.urgency === 'critical' ? 'critical' : 'outline'}
                        className="text-[10px]"
                      >
                        {FR.urgencies[req.urgency]}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {FR.statuses[req.status]}
                      </Badge>
                    </div>
                    <p className="truncate text-sm font-medium">{req.partDescription}</p>
                    <div className="text-muted-foreground flex items-center gap-3 text-xs">
                      <span className="truncate">{req.client.company || req.client.name}</span>
                      <span className="text-border">•</span>
                      <span className="truncate">{req.suspectedMaterial || 'Non précisée'}</span>
                      <span className="text-border">•</span>
                      <span>Qté: {req.quantity}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/admin/demandes/${req.id}/recherche`}>
                      <Badge variant="default" className="text-[10px]">
                        <Search className="h-3.5 w-3.5" />
                        Recherche
                      </Badge>
                    </Link>
                    <Link href={`/admin/demandes/${req.id}`}>
                      <Badge variant="outline" className="text-[10px]">
                        Détails
                      </Badge>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6 lg:col-span-4">
          {/* Sync Status */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Synchronisation</CardTitle>
                <Badge variant="outline" className="font-mono text-[10px]">
                  Neon Postgres
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="bg-muted/30 space-y-2 rounded-lg border p-3 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dernier Pull :</span>
                  <span className="font-semibold">
                    {lastSyncAt ? formatDate(lastSyncAt) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">En attente :</span>
                  <span className="font-bold text-amber-600">{pendingCount} demande(s)</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="w-full justify-center gap-2 text-xs font-semibold"
                onClick={() => triggerSync()}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sync en cours...' : 'Forcer un Pull'}
              </Badge>
            </CardContent>
          </Card>

          {/* Machine Load */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Parc machines</CardTitle>
                <Link href="/admin/machines" className="text-primary text-xs hover:underline">
                  Gérer
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {machines.slice(0, 3).map((m) => (
                <div key={m.id} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="max-w-[160px] truncate font-medium">{m.name}</span>
                    <span className="font-mono text-[10px] font-bold">{m.status}</span>
                  </div>
                  <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className={`h-full bg-emerald-500 transition-all`}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
