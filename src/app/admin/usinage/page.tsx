'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { INITIAL_REQUESTS, WORKSHOP_MACHINES } from '@/lib/mock-data';
import { FR } from '@/i18n/fr';
import { KPICard } from '@/components/shared/kpi-card';
import { Play, Pause } from 'lucide-react';

const TIMES = [45, 120, 30, 90] as const;
const PROGRESS = [78, 15, 0, 55] as const;
const PHASES = ['Finition', 'Démarrage', 'En attente', 'Mi-usinage'] as const;

const PRODUCTION_QUEUE = INITIAL_REQUESTS.map((req, i) => {
  const machine = WORKSHOP_MACHINES[i % WORKSHOP_MACHINES.length] ?? WORKSHOP_MACHINES[0]!;
  return {
    requestId: req.id,
    cloudId: req.cloudId,
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

export default function AdminUsinagePage() {
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
          title="Machines actives"
          value={WORKSHOP_MACHINES.filter((m) => m.status === 'active').length}
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
                        #REQ-{job.cloudId}
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
          <h2 className="text-sm font-semibold">Charge parc CNC</h2>
          {WORKSHOP_MACHINES.map((m) => (
            <Card key={m.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <p className="max-w-[160px] truncate text-xs font-semibold">{m.name}</p>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${
                      m.status === 'active'
                        ? 'border-emerald-500/30 text-emerald-600'
                        : 'border-blue-500/30 text-blue-600'
                    }`}
                  >
                    {m.status === 'active' ? 'Actif' : 'Libre'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span>Charge</span>
                    <span className="font-bold">{m.loadPercent}%</span>
                  </div>
                  <Progress
                    value={m.loadPercent}
                    className={`h-1.5 ${m.loadPercent > 80 ? '[&>div]:bg-amber-500' : ''}`}
                  />
                </div>
                <p className="truncate text-[10px] text-muted-foreground">{m.currentJob}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
