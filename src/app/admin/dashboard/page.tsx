'use client';

import * as React from 'react';
import { getDashboard } from '@/lib/data-client';
import { mapRequestToUi } from '@/lib/utils/request-mappers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/shared/kpi-card';
import AuthGuard from '@/lib/auth-guard';
import { cn } from '@/lib/utils';
import { ArrowRight, Inbox, Cpu, Layers, Package, Plus, Activity, Wrench, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import type { MappedRequest } from '@/lib/utils/request-mappers';

interface KpiData {
  demandesEnAttente: number;
  piecesEnBdd: number;
  tauxSucces: number;
  engineAnalysesCount?: number;
  engineGeneratedPartsCount?: number;
  engineSuccessRate?: number;
  totalParts?: number;
  totalReProjects?: number;
  totalPcbProjects?: number;
  pendingRequests?: number;
  pendingPcbRequirements?: number;
  lastUpdated?: string;
}

const STAT_CARDS = [
  { title: 'Total Pièces', href: '/admin/pieces', icon: Package, valueKey: 'totalParts' },
  { title: 'Total Projets RE', href: '/admin/reverse-engineering', icon: Layers, valueKey: 'totalReProjects' },
  { title: 'Total Projets PCB', href: '/admin/pcb', icon: Cpu, valueKey: 'totalPcbProjects' },
  { title: 'Demandes en cours', href: '/admin/demandes', icon: Inbox, valueKey: 'pendingRequests' },
] as const;

function AdminDashboardPageContent() {
  const [requests, setRequests] = React.useState<MappedRequest[]>([]);
  const [kpi, setKpi] = React.useState<KpiData | null>(null);
  const [kpiLoading, setKpiLoading] = React.useState(true);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    console.info('[DASHBOARD:UI] Poste de contrôle monté', { timestamp: new Date().toISOString() });

    let mounted = true;

    async function fetchData() {
      try {
        const [dashboardData, kpiRes] = await Promise.all([
          getDashboard(),
          fetch('/api/dashboard/kpi', { cache: 'no-store' }),
        ]);

        const { requests: reqs } = dashboardData;
        if (!mounted) return;
        setRequests(reqs?.map(mapRequestToUi) || []);

        if (kpiRes.ok) {
          const data = (await kpiRes.json()) as KpiData;
          if (mounted) setKpi(data);
          console.info('[DASHBOARD:UI] Données réelles affichées', { kpis: data });
        }
      } catch (error) {
        console.error('[DASHBOARD:UI] Failed to fetch dashboard:', error);
        if (mounted) setRequests([]);
      } finally {
        if (mounted) {
          setKpiLoading(false);
          setLoading(false);
        }
      }
    }

    fetchData();
    console.info('[DASHBOARD:UI] Cartes statistiques rendues');

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-content" className="mx-auto max-w-7xl space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-gray-900">
          Poste de Contrôle
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Files d&apos;attente, création rapide et statistiques d&apos;un coup d&apos;œil.
        </p>
      </div>

      {/* Section 1 — Files d'attente */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-amber-300 bg-amber-50/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">Pièces reçues (non consultées)</CardTitle>
              <Inbox className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="flex items-end justify-between gap-4">
            <span className="text-3xl font-bold text-amber-600">
              {kpiLoading ? '—' : (kpi?.pendingRequests ?? 0)}
            </span>
            <Link
              href="/admin/demandes"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Voir tout
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-amber-300 bg-amber-50/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">
                Cahiers des charges PCB reçus (non consultés)
              </CardTitle>
              <Cpu className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="flex items-end justify-between gap-4">
            <span className="text-3xl font-bold text-amber-600">
              {kpiLoading ? '—' : (kpi?.pendingPcbRequirements ?? 0)}
            </span>
            <Link
              href="/admin/pcb/requirements"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Voir tout
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Section 2 — Création rapide */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link
            href="/admin/pieces/nouveau"
            onClick={() =>
              console.info('[DASHBOARD:UI] Action création cliquée', { type: 'piece' })
            }
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-semibold">Nouvelle pièce (interne)</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link
            href="/admin/pcb/nouveau"
            onClick={() =>
              console.info('[DASHBOARD:UI] Action création cliquée', { type: 'pcb' })
            }
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-semibold">Nouveau cahier des charges PCB (interne)</span>
          </Link>
        </Button>
      </section>

      {/* Section 3 — Cartes de statistiques */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_CARDS.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">{stat.title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold text-muted-foreground">
                    {kpiLoading ? '—' : (kpi?.[stat.valueKey] ?? '--')}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* KPI existants conservés */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div data-testid="kpi-card" data-kpi-title="Demandes en attente">
            <KpiCard
              title="Demandes en attente"
              value={kpiLoading ? '—' : (kpi?.demandesEnAttente ?? 0)}
              description="À qualifier / chercher"
              variant="warning"
            />
          </div>
          <div data-testid="kpi-card" data-kpi-title="Pièces en BDD">
            <KpiCard
              title="Pièces en BDD"
              value={kpiLoading ? '—' : `${kpi?.piecesEnBdd ?? requests.length} réf.`}
              description="Source de vérité Neon Postgres"
              variant="default"
            />
          </div>
          <div data-testid="kpi-card" data-kpi-title="Taux de succès">
            <KpiCard
              title="Taux de succès"
              value={kpiLoading ? '—' : kpi && kpi.tauxSucces > 0 ? `${kpi.tauxSucces}%` : 'N/A'}
              description="30 derniers jours (clôturées)"
              variant="success"
            />
          </div>
          <div data-testid="kpi-card" data-kpi-title="Analyses lancées">
            <KpiCard
              title="Analyses lancées"
              value={kpiLoading ? '—' : (kpi?.engineAnalysesCount ?? 0)}
              description="Moteur workspace"
              variant="default"
              icon={Activity}
            />
          </div>
          <div data-testid="kpi-card" data-kpi-title="Pièces générées">
            <KpiCard
              title="Pièces générées"
              value={kpiLoading ? '—' : (kpi?.engineGeneratedPartsCount ?? 0)}
              description="Par le moteur"
              variant="default"
              icon={Wrench}
            />
          </div>
          <div data-testid="kpi-card" data-kpi-title="Taux de succès moteur">
            <KpiCard
              title="Taux de succès moteur"
              value={
                kpiLoading
                  ? '—'
                  : kpi && (kpi.engineSuccessRate ?? 0) > 0
                    ? `${kpi.engineSuccessRate}%`
                    : 'N/A'
              }
              description="Pièces analysées / générées"
              variant="success"
              icon={TrendingUp}
            />
          </div>
        </div>
      </section>

      {/* Section 4 — Activité récente */}
      <section>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-sm text-muted-foreground')}>Historique des activités (à venir)</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard>
      <AdminDashboardPageContent />
    </AuthGuard>
  );
}
