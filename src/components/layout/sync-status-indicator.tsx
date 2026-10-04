'use client'

import * as React from 'react'
import { useSyncStore } from '@/lib/stores/sync-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CloudDownload, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

export function SyncStatusIndicator() {
  const { lastSyncAt, pendingCount, isSyncing, triggerSync } = useSyncStore()

  const handleSync = async () => {
    toast.info('Interrogation de la file cloud Neon Postgres...')
    const result = await triggerSync()
    if (result.received > 0) {
      toast.success(`${result.received} nouvelle(s) demande(s) récupérée(s) dans la BDD locale !`)
    } else {
      toast.info('BDD locale à jour (aucune nouvelle demande en attente).')
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isSyncing ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isSyncing ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
        </span>
        <span className="text-muted-foreground hidden sm:inline">
          Sync Cloud → Local :
        </span>
        <span className="font-mono text-[11px] text-foreground">
          {lastSyncAt ? formatDate(lastSyncAt) : 'En attente'}
        </span>
      </div>

      {pendingCount > 0 && (
        <Badge variant="warning" className="gap-1 text-[11px] font-mono">
          <CloudDownload className="w-3 h-3" />
          {pendingCount} en attente cloud
        </Badge>
      )}

      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={handleSync}
        disabled={isSyncing}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
        <span>{isSyncing ? 'Syncing...' : 'Tirer (Pull)'}</span>
      </Button>
    </div>
  )
}
