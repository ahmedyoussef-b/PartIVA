'use client'

import * as React from 'react'
import { INITIAL_REQUESTS } from '@/lib/mock-data'
import { FR } from '@/i18n/fr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import {
  FileSpreadsheet,
  Search,
  User,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Hammer,
  Eye,
} from 'lucide-react'

type AuditAction =
  | 'sync_pull'
  | 'request_received'
  | 'search_launched'
  | 'candidate_selected'
  | 'reverse_started'
  | 'machining_started'
  | 'completed'

interface AuditEntry {
  id: string
  ts: string
  action: AuditAction
  actor: string
  entityId: string
  entityType: 'request' | 'part' | 'sync'
  description: string
  severity: 'info' | 'success' | 'warning'
}

const AUDIT_LOG: AuditEntry[] = [
  {
    id: 'aud-1',
    ts: '2026-10-04T16:35:00Z',
    action: 'sync_pull',
    actor: 'Daemon Sync',
    entityId: 'sync',
    entityType: 'sync',
    description: '2 nouvelles demandes tirées depuis Neon Postgres (REQ-1041, REQ-1042)',
    severity: 'success',
  },
  {
    id: 'aud-2',
    ts: '2026-10-04T16:33:00Z',
    action: 'request_received',
    actor: 'Mohamed Ben Salem',
    entityId: 'a1111111-2222-3333-4444-555555555551',
    entityType: 'request',
    description: 'Demande REQ-1042 soumise : Étoile de transfert bouteilles — URGENCE CRITIQUE',
    severity: 'warning',
  },
  {
    id: 'aud-3',
    ts: '2026-10-04T14:20:00Z',
    action: 'candidate_selected',
    actor: 'Ingénieur Méthodes',
    entityId: 'a1111111-2222-3333-4444-555555555552',
    entityType: 'request',
    description: 'Candidat PL-004812 (88%) validé pour REQ-1041 — TraceParts source',
    severity: 'success',
  },
  {
    id: 'aud-4',
    ts: '2026-10-04T13:55:00Z',
    action: 'search_launched',
    actor: 'Ingénieur Méthodes',
    entityId: 'a1111111-2222-3333-4444-555555555552',
    entityType: 'request',
    description: 'Recherche multi-sources lancée pour REQ-1041 (SITEX Denim)',
    severity: 'info',
  },
  {
    id: 'aud-5',
    ts: '2026-10-04T09:40:00Z',
    action: 'reverse_started',
    actor: 'Ingénieur CAO',
    entityId: 'a1111111-2222-3333-4444-555555555553',
    entityType: 'request',
    description: 'Reverse Engineering démarré pour REQ-1039 — Bague PTFE CHO Sfax',
    severity: 'info',
  },
  {
    id: 'aud-6',
    ts: '2026-10-04T08:00:00Z',
    action: 'machining_started',
    actor: 'Opérateur CNC',
    entityId: 'a1111111-2222-3333-4444-555555555554',
    entityType: 'request',
    description: 'Usinage démarré sur Haas ST-20 — Patin PA66 STIP Pneus (×6)',
    severity: 'success',
  },
  {
    id: 'aud-7',
    ts: '2026-10-03T18:00:00Z',
    action: 'request_received',
    actor: 'Sami Triki',
    entityId: 'a1111111-2222-3333-4444-555555555553',
    entityType: 'request',
    description: "Demande REQ-1039 reçue : Bague PTFE décanteur CHO Huile d'Olive",
    severity: 'info',
  },
]

const ACTION_CONFIG: Record<AuditAction, { label: string; icon: React.ElementType; color: string }> = {
  sync_pull:          { label: 'Sync Cloud',        icon: RefreshCw,     color: 'text-blue-500' },
  request_received:   { label: 'Demande reçue',     icon: Database,      color: 'text-violet-500' },
  search_launched:    { label: 'Recherche lancée',  icon: Search,        color: 'text-amber-500' },
  candidate_selected: { label: 'Candidat validé',   icon: CheckCircle2,  color: 'text-emerald-500' },
  reverse_started:    { label: 'Reverse CAO',       icon: Wrench,        color: 'text-orange-500' },
  machining_started:  { label: 'Usinage démarré',   icon: Hammer,        color: 'text-primary' },
  completed:          { label: 'Dossier clôturé',   icon: CheckCircle2,  color: 'text-emerald-600' },
}

export default function AdminAuditPage() {
  const [query, setQuery] = React.useState('')

  const filtered = AUDIT_LOG.filter((entry) => {
    const q = query.toLowerCase()
    return (
      entry.description.toLowerCase().includes(q) ||
      entry.actor.toLowerCase().includes(q) ||
      entry.action.includes(q)
    )
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Journal d'Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Traçabilité complète de toutes les actions métier et opérations système.
          </p>
        </div>
        <Button variant="outline" className="gap-2 text-xs">
          <FileSpreadsheet className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filtrer les événements…"
          className="pl-9 text-xs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            {filtered.length} événement(s)
          </CardTitle>
          <CardDescription className="text-xs">
            Log chronologique décroissant — toutes les opérations sensibles sont tracées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />

            <div className="space-y-0">
              {filtered.map((entry, i) => {
                const cfg = ACTION_CONFIG[entry.action]
                const Icon = cfg.icon
                return (
                  <div key={entry.id} className="flex gap-4 group relative">
                    {/* Dot */}
                    <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 border-background z-10 ${
                      entry.severity === 'success'
                        ? 'bg-emerald-500/15'
                        : entry.severity === 'warning'
                        ? 'bg-amber-500/15'
                        : 'bg-muted'
                    }`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-6 ${i === filtered.length - 1 ? 'pb-0' : ''}`}>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[9px] font-mono">
                          {cfg.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(entry.ts).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-[10px] flex items-center gap-1 text-muted-foreground">
                          <User className="w-2.5 h-2.5" />
                          {entry.actor}
                        </span>
                      </div>
                      <p className="text-xs text-foreground leading-snug">{entry.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
