'use client'

import * as React from 'react'
import { WORKSHOP_MACHINES } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Cpu,
  Hammer,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  BarChart3,
  Zap,
  Settings,
} from 'lucide-react'

const DEFAULT_STATUS_CONFIG = {
  label: 'Disponible',
  color: 'text-blue-500',
  bgColor: 'bg-blue-500/10',
  borderColor: 'border-blue-500/30',
  icon: CheckCircle2,
}

const STATUS_CONFIG: Record<string, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ElementType
}> = {
  active: {
    label: 'En production',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: Activity,
  },
  idle: DEFAULT_STATUS_CONFIG,
  maintenance: {
    label: 'Maintenance',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: Wrench,
  },
  error: {
    label: 'Hors service',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    icon: AlertCircle,
  },
}

const ADDITIONAL_MACHINES = [
  {
    id: 'mach-5',
    name: 'Scie à ruban Bizerba GSP-H',
    type: 'Tronçonnage barres plastiques',
    capacity: 'Section max 300 × 300 mm, vitesse 20–100 m/min',
    status: 'active',
    currentJob: 'Débit barre POM-C Ø90 mm',
    loadPercent: 30,
  },
  {
    id: 'mach-6',
    name: 'Poinçonneuse / Foreuse colonne Alzmetall',
    type: 'Perçage et taraudage haute précision',
    capacity: 'Mandrin 16 mm / Table 560 × 400 mm',
    status: 'idle',
    currentJob: 'Disponible',
    loadPercent: 0,
  },
]

const ALL_MACHINES = [...WORKSHOP_MACHINES, ...ADDITIONAL_MACHINES]

export default function AdminMachinesPage() {
  const activeCount = ALL_MACHINES.filter((m) => m.status === 'active').length
  const idleCount = ALL_MACHINES.filter((m) => m.status === 'idle').length
  const avgLoad = Math.round(
    ALL_MACHINES.reduce((sum, m) => sum + m.loadPercent, 0) / ALL_MACHINES.length
  )

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Parc Machines CNC
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Supervision en temps réel des équipements d'usinage plastiques techniques.
          </p>
        </div>
        <Button variant="outline" className="gap-2 text-xs">
          <Settings className="w-4 h-4" />
          Planification maintenance
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total équipements', value: ALL_MACHINES.length, icon: Cpu, color: 'text-primary' },
          { label: 'En production', value: activeCount, icon: Activity, color: 'text-emerald-500' },
          { label: 'Disponibles', value: idleCount, icon: CheckCircle2, color: 'text-blue-500' },
          { label: 'Charge moy.', value: `${avgLoad}%`, icon: BarChart3, color: 'text-amber-500' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="bg-card/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Machine cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ALL_MACHINES.map((machine) => {
          const config = STATUS_CONFIG[machine.status] ?? DEFAULT_STATUS_CONFIG
          const StatusIcon = config.icon
          return (
            <Card
              key={machine.id}
              className={`border transition-all hover:shadow-md ${config.borderColor}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${config.bgColor}`}>
                      <Hammer className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold leading-snug">
                        {machine.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {machine.type}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] border ${config.borderColor} ${config.color}`}
                  >
                    <StatusIcon className="w-2.5 h-2.5 mr-1" />
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground font-mono border-l-2 border-border pl-3 py-1">
                  {machine.capacity}
                </div>

                {machine.status === 'active' && (
                  <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Zap className={`w-3.5 h-3.5 ${config.color}`} />
                        <span>{machine.currentJob}</span>
                      </div>
                      <span className={`font-mono font-bold ${config.color}`}>
                        {machine.loadPercent}%
                      </span>
                    </div>
                    <Progress value={machine.loadPercent} className="h-1.5" />
                  </div>
                )}

                {machine.status === 'idle' && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-500 bg-blue-500/5 rounded-lg px-3 py-2 border border-blue-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Prêt — aucune pièce en cours</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                    <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                    Historique
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                    <Wrench className="w-3.5 h-3.5 mr-1.5" />
                    Programme
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
