'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { INITIAL_REQUESTS, WORKSHOP_MACHINES } from '@/lib/mock-data'
import { FR } from '@/i18n/fr'
import { formatDate } from '@/lib/utils'
import { useSyncStore } from '@/lib/stores/sync-store'
import { KPICard } from '@/components/shared/kpi-card'
import { ArrowRight, RefreshCw, Search } from 'lucide-react'

export default function AdminDashboardPage() {
  const { lastSyncAt, pendingCount, isSyncing, triggerSync } = useSyncStore()
  const requests = INITIAL_REQUESTS
  const machines = WORKSHOP_MACHINES

  const pendingRequests = requests.filter((r) => r.status === 'new' || r.status === 'searching')

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            File de fabrication, recherche multi-sources et parc machines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/sync">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              Sync
            </Button>
          </Link>
          <Link href="/admin/pieces/nouveau">
            <Button size="sm" className="gap-2 text-xs font-semibold">
              Nouvelle pièce
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Request Queue */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">File d&apos;attente</h2>
            <Link
              href="/admin/demandes"
              className="text-xs text-primary hover:underline font-medium"
            >
              Voir tout ({requests.length}) →
            </Link>
          </div>

          <div className="space-y-2">
            {requests.slice(0, 5).map((req) => (
              <Card key={req.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-primary">
                        {req.cloudId ? `#REQ-${req.cloudId}` : req.id.slice(0, 8)}
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
                    <p className="text-sm font-medium truncate">{req.partDescription}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="truncate">{req.client.company || req.client.name}</span>
                      <span className="text-border">•</span>
                      <span className="truncate">{req.suspectedMaterial || 'Non précisée'}</span>
                      <span className="text-border">•</span>
                      <span>Qté: {req.quantity}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/admin/demandes/${req.id}/recherche`}>
                      <Button size="sm" variant="default" className="gap-1.5 text-xs">
                        <Search className="w-3.5 h-3.5" />
                        Recherche
                      </Button>
                    </Link>
                    <Link href={`/admin/demandes/${req.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Détails
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Sync Status */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Synchronisation</CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Neon Postgres
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border bg-muted/30 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dernier Pull :</span>
                  <span className="font-semibold">{lastSyncAt ? formatDate(lastSyncAt) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">En attente :</span>
                  <span className="font-bold text-amber-600">{pendingCount} demande(s)</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2 text-xs font-semibold"
                onClick={() => triggerSync()}
                disabled={isSyncing}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sync en cours...' : 'Forcer un Pull'}
              </Button>
            </CardContent>
          </Card>

          {/* Machine Load */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Charge CNC</CardTitle>
                <Link href="/admin/machines" className="text-xs text-primary hover:underline">
                  Gérer
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {machines.slice(0, 3).map((m) => (
                <div key={m.id} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-medium truncate max-w-[160px]">{m.name}</span>
                    <span className="font-mono font-bold text-xs">{m.loadPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        m.loadPercent > 85 ? 'bg-rose-500' : m.loadPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${m.loadPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
