'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { FR } from '@/i18n/fr';
import { KPICard } from '@/components/shared/kpi-card';
import type { MappedRequest } from '@/lib/utils/request-mappers';
import type { MachineWithRelations } from '@/lib/data/machines';

const TIMES = [45, 120, 30, 90] as const;
const PROGRESS = [78, 15, 0, 55] as const;
const PHASES = ['Finition', 'Démarrage', 'En attente', 'Mi-usinage'] as const;

interface AdminUsinageClientProps {
  requests: MappedRequest[];
  machines: MachineWithRelations[];
}

export default function AdminUsinageClient({ requests, machines }: AdminUsinageClientProps) {
  const PRODUCTION_QUEUE = requests.map((req, i) => {
    const machine = machines[i % machines.length] ?? machines[0]!;
    return {
      requestId: req.id,
      cloudId: undefined,
      clientCompany: req.client.company || req.client.name,
      partDescription: req.partDescription.slice(0, 60) + '…',
      suspectedMaterial: req.suspectedMaterial,
      quantity: req.quantity,
      urgency: req.urgency,
      status: req.status,
      machineId: machine.id,
      machineName: machine.name.split(' ').slice(0, 3).join(' '),
      estimatedTime: TIMES[i % TIMES.length] ?? 60,
      progressPercent: PROGRESS[i % PROGRESS.length] ?? 0,
      phase: PHASES[i % PHASES.length] ?? 'En attente',
    };
  });

  const activeJobs = PRODUCTION_QUEUE.filter(
    (j) => j.progressPercent > 0 && j.progressPercent < 100,
  );
  const waiting = PRODUCTION_QUEUE.filter((j) => j.progressPercent === 0);

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Atelier Usinage</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Suivi temps réel des pièces plastiques en fabrication.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="En usinage" value={activeJobs.length} variant="success" />
        <KPICard title="En attente" value={waiting.length} variant="warning" />
        <KPICard title="Terminées (mois)" value={3} variant="default" />
        <KPICard
          title="Machines"
          value={machines.length}
          variant="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active jobs */}
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold">Pièces en cours</h2>
          {PRODUCTION_QUEUE.map((job) => (
            <Card
              key={job.requestId}
              className={`${
                job.progressPercent > 0 && job.progressPercent < 100
                  ? 'border-emerald-500/30'
                  : job.progressPercent === 0
                    ? 'border-amber-500/20'
                    : 'border-border'
              }`}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        {job.cloudId ? `#REQ-${job.cloudId}` : job.requestId.slice(0, 8)}
                      </span>
                      <Badge
                        variant={job.urgency === 'critical' ? 'critical' : 'outline'}
                        className="text-[10px]"
                      >
                        {FR.urgencies[job.urgency]}
                      </Badge>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {job.suspectedMaterial}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {job.clientCompany} — {job.partDescription}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {job.progressPercent > 0 && job.progressPercent < 100 ? (
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                        <Pause className="h-3 w-3" />
                        Pause
                      </Button>
                    ) : job.progressPercent === 0 ? (
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                        <Play className="h-3 w-3" />
                        Démarrer
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{job.machineName}</span>
                  <span>•</span>
                  <span>~{job.estimatedTime} min</span>
                  <span>•</span>
                  <span>×{job.quantity} pcs</span>
                  {job.progressPercent > 0 && (
                    <Badge
                      variant="outline"
                      className="ml-auto border-emerald-500/30 text-[9px] text-emerald-600"
                    >
                      {job.phase}
                    </Badge>
                  )}
                </div>

                {job.progressPercent > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                      <span>Avancement</span>
                      <span className="font-bold">{job.progressPercent}%</span>
                    </div>
                    <Progress value={job.progressPercent} className="h-2" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-amber-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    En attente d&apos;affectation machine
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Machine load */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">Parc machines</h2>
          {machines.map((m) => (
            <Card key={m.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <p className="max-w-[160px] truncate text-xs font-semibold">{m.name}</p>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${
                      m.status === 'RUNNING'
                        ? 'border-emerald-500/30 text-emerald-600'
                        : 'border-blue-500/30 text-blue-600'
                    }`}
                  >
                    {m.status === 'RUNNING' ? 'Actif' : 'Libre'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span>Type</span>
                    <span className="font-bold">{m.type}</span>
                  </div>
                </div>
                {m.location ? (
                  <p className="truncate text-[10px] text-muted-foreground">{m.location}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
