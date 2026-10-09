'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getMachineTypeLabel } from '@/lib/enum-labels';
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
} from 'lucide-react';
import type { MachineWithRelations } from '@/lib/data/machines';

interface MachineWithUi extends MachineWithRelations {
  loadPercent?: number;
  currentJob?: string;
  capacity?: string;
}

interface MachinesClientProps {
  initialMachines: MachineWithUi[];
}

const DEFAULT_STATUS_CONFIG = {
  label: 'Disponible',
  color: 'text-blue-500',
  bgColor: 'bg-blue-500/10',
  borderColor: 'border-blue-500/30',
  icon: CheckCircle2,
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ElementType;
  }
> = {
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
};

export default function MachinesClient({ initialMachines }: MachinesClientProps) {
  const machines = React.useMemo(() => initialMachines, [initialMachines]);

  const activeCount = machines.filter((m) => m.status === 'RUNNING').length;
  const idleCount = machines.filter((m) => m.status === 'IDLE').length;
  const avgLoad = Math.round(
    machines.reduce((sum, m) => sum + (m.loadPercent ?? 0), 0) / Math.max(machines.length, 1),
  );

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Parc Machines CNC</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Supervision en temps réel des équipements d&apos;usinage plastiques techniques.
          </p>
        </div>
        <Button variant="outline" className="gap-2 text-xs">
          <Settings className="h-4 w-4" />
          Planification maintenance
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total équipements', value: machines.length, icon: Cpu, color: 'text-primary' },
          { label: 'En production', value: activeCount, icon: Activity, color: 'text-emerald-500' },
          { label: 'Disponibles', value: idleCount, icon: CheckCircle2, color: 'text-blue-500' },
          { label: 'Charge moy.', value: `${avgLoad}%`, icon: BarChart3, color: 'text-amber-500' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="bg-card/60">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`bg-muted rounded-lg p-2 ${s.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-muted-foreground text-[10px]">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Machine cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {machines.map((machine) => {
          const config = STATUS_CONFIG[machine.status.toLowerCase()] ?? DEFAULT_STATUS_CONFIG;
          const StatusIcon = config.icon;
          const loadPercent = machine.loadPercent ?? 0;
          const currentJob = machine.currentJob ?? '—';
          const capacity = machine.capacity ?? '—';
          return (
            <Card
              key={machine.id}
              className={`border transition-all hover:shadow-md ${config.borderColor}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2.5 ${config.bgColor}`}>
                      <Hammer className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm leading-snug font-bold">
                        {machine.name}
                      </CardTitle>
                      <CardDescription className="mt-0.5 text-xs">{getMachineTypeLabel(machine.type)}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 border text-[10px] ${config.borderColor} ${config.color}`}
                  >
                    <StatusIcon className="mr-1 h-2.5 w-2.5" />
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="border-border text-muted-foreground border-l-2 py-1 pl-3 font-mono text-xs">
                  {capacity}
                </div>

                {machine.status === 'RUNNING' && (
                  <div className="bg-muted/40 space-y-2 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Zap className={`h-3.5 w-3.5 ${config.color}`} />
                        <span>{currentJob}</span>
                      </div>
                      <span className={`font-mono font-bold ${config.color}`}>{loadPercent}%</span>
                    </div>
                    <Progress value={loadPercent} className="h-1.5" />
                  </div>
                )}

                {machine.status === 'IDLE' && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs text-blue-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Prêt — aucune pièce en cours</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="h-8 flex-1 text-xs">
                    <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                    Historique
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 flex-1 text-xs">
                    <Wrench className="mr-1.5 h-3.5 w-3.5" />
                    Programme
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
