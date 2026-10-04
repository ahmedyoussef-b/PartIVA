'use client'

import * as React from 'react'
import { useSyncStore } from '@/lib/stores/sync-store'
import { INITIAL_REQUESTS } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils'
import {
  RefreshCw,
  Cloud,
  Database,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Activity,
  Clock,
  ArrowDownCircle,
  Server,
  Wifi,
  WifiOff,
  Info,
} from 'lucide-react'

const SYNC_LOGS = [
  { ts: '2026-10-04T16:35:00Z', type: 'success', msg: 'Synchronisation réussie — 2 nouvelles demandes pulled (REQ-1041, REQ-1042)' },
  { ts: '2026-10-04T15:50:00Z', type: 'success', msg: 'Heartbeat cloud OK — Neon Postgres répond en 42 ms' },
  { ts: '2026-10-04T14:20:00Z', type: 'info',    msg: 'Aucune nouvelle demande — file cloud vide' },
  { ts: '2026-10-04T13:00:00Z', type: 'success', msg: 'Synchronisation réussie — 1 nouvelle demande pulled (REQ-1039)' },
  { ts: '2026-10-04T11:30:00Z', type: 'warning', msg: 'Latence cloud élevée (820 ms) — retry automatique réussi' },
  { ts: '2026-10-04T09:15:00Z', type: 'success', msg: 'Démarrage daemon de synchronisation — intervalle 45 s' },
]

export default function AdminSyncPage() {
  const { lastSyncAt, pendingCount, isSyncing, triggerSync } = useSyncStore()
  const [syncProgress, setSyncProgress] = React.useState(0)

  const handleManualSync = async () => {
    setSyncProgress(0)
    const interval = setInterval(() => {
      setSyncProgress((p) => Math.min(p + 15, 95))
    }, 200)
    await triggerSync().catch(() => {})
    clearInterval(interval)
    setSyncProgress(100)
    setTimeout(() => setSyncProgress(0), 2000)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Console Synchronisation Cloud
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pull unidirectionnel : Neon Postgres (cloud) → SQLite (local atelier)
          </p>
        </div>
        <Button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="gap-2 font-bold shadow-xs"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Synchronisation…
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Sync Manuel
            </>
          )}
        </Button>
      </div>

      {/* Architecture diagram card */}
      <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {/* Cloud side */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <Cloud className="w-8 h-8 text-blue-500" />
              </div>
              <span className="text-xs font-bold text-blue-500">Neon Postgres</span>
              <span className="text-[10px] text-muted-foreground">Cloud • File temporaire</span>
              <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-500">
                {INITIAL_REQUESTS.length} demandes
              </Badge>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span>Unidirectionnel</span>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <ArrowDownCircle className="w-6 h-6 sm:rotate-[-90deg]" />
              </div>
              <span className="text-[10px] text-muted-foreground">Toutes 45 s</span>
            </div>

            {/* Local side */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <Database className="w-8 h-8 text-emerald-500" />
              </div>
              <span className="text-xs font-bold text-emerald-500">SQLite Local</span>
              <span className="text-[10px] text-muted-foreground">Atelier • Hors-ligne possible</span>
              <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500">
                Persistance locale
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Status card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Statut actuel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${
              isSyncing
                ? 'border-blue-500/30 bg-blue-500/5'
                : 'border-emerald-500/30 bg-emerald-500/5'
            }`}>
              {isSyncing ? (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4 text-emerald-500" />
              )}
              <span className={`text-xs font-bold ${isSyncing ? 'text-blue-500' : 'text-emerald-500'}`}>
                {isSyncing ? 'Synchronisation en cours' : 'Connecté — OK'}
              </span>
            </div>
            {isSyncing && syncProgress > 0 && (
              <Progress value={syncProgress} className="h-1.5" />
            )}
            <div className="text-[10px] text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Dernière sync</span>
                <span className="font-mono font-semibold text-foreground">
                  {lastSyncAt ? formatDate(lastSyncAt) : 'Jamais'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Intervalle auto</span>
                <span className="font-mono font-semibold text-foreground">45 s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              File d'attente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-black text-primary text-center py-2">
              {pendingCount}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              demande(s) en attente de pull depuis Neon
            </p>
            {pendingCount > 0 && (
              <Badge variant="outline" className="w-full justify-center text-[10px] border-amber-500/30 text-amber-500">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Action requise
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Config card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[10px] text-muted-foreground">
            {[
              { label: 'Endpoint', value: 'neon.tech/partiva-prod' },
              { label: 'Pull strategy', value: 'Unidirectionnel' },
              { label: 'Chiffrement', value: 'TLS 1.3' },
              { label: 'Rétention locale', value: '90 jours' },
            ].map((c) => (
              <div key={c.label} className="flex justify-between border-b border-border/50 pb-1">
                <span>{c.label}</span>
                <span className="font-mono font-semibold text-foreground">{c.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Sync log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Journal de Synchronisation</CardTitle>
          <CardDescription className="text-xs">
            Dernières opérations de pull cloud → local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SYNC_LOGS.map((log, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${
                  log.type === 'success'
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : log.type === 'warning'
                    ? 'border-amber-500/20 bg-amber-500/5'
                    : 'border-border bg-muted/20'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {log.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  {log.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  {log.type === 'info' && <Info className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="leading-snug">{log.msg}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {new Date(log.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
