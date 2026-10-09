import { getCurrentUser } from '@/lib/auth-server';
import { getRequests } from '@/lib/data/requests';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PipelineStepper } from '@/components/domain/pipeline-stepper';
import { FR } from '@/i18n/fr';
import { formatDate } from '@/lib/utils';
import { FileText, Clock, Hammer, CheckCircle2, PlusCircle, ArrowRight } from 'lucide-react';

const URGENCY_LABELS: Record<string, string> = {
  LOW: FR.urgencies.low,
  MEDIUM: FR.urgencies.normal,
  HIGH: FR.urgencies.high,
  URGENT: FR.urgencies.critical,
};

export default async function ClientDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const requests = await getRequests({ clientId: user.id, limit: 3 });

  return (
    <div className="max-w-6xl space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Espace Maintenance & Commandes
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Suivez la numérisation CAO, l&apos;usinage et l&apos;expédition de vos pièces
            industrielles.
          </p>
        </div>
        <Link href="/demande">
          <Button className="gap-2 font-bold shadow-md">
            <PlusCircle className="h-4 w-4" />
            Demander une refabrication
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <span className="text-muted-foreground text-xs font-medium">Demandes actives</span>
            <FileText className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="font-mono text-2xl font-black">{requests.length}</div>
            <p className="text-muted-foreground mt-0.5 text-[11px]">Votre espace client</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <span className="text-muted-foreground text-xs font-medium">Usinage en cours</span>
            <Hammer className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="font-mono text-2xl font-black text-amber-500">
              {requests.filter((req) => req.status === 'IN_PROGRESS').length}
            </div>
            <p className="text-muted-foreground mt-0.5 text-[11px]">Sur vos demandes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <span className="text-muted-foreground text-xs font-medium">Pièces livrées</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="font-mono text-2xl font-black text-emerald-500">
              {requests.filter((req) => req.status === 'COMPLETED').length}
            </div>
            <p className="text-muted-foreground mt-0.5 text-[11px]">Année en cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <span className="text-muted-foreground text-xs font-medium">Délai moyen constaté</span>
            <Clock className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="font-mono text-2xl font-black">3.4 j</div>
            <p className="text-muted-foreground mt-0.5 text-[11px]">vs 8 semaines import</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Requests List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Vos demandes en cours de traitement</h2>
          <Link
            href="/client/dashboard/demandes"
            className="text-primary text-xs font-semibold hover:underline"
          >
            Voir l&apos;historique complet →
          </Link>
        </div>

        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="hover:border-primary/50 transition-all">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col justify-between gap-2 border-b pb-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-primary font-mono text-xs font-bold">
                      {req.id.slice(0, 8)}
                    </span>
                    <Badge
                      variant={req.urgency === 'URGENT' ? 'critical' : 'outline'}
                      className="text-[10px]"
                    >
                      Urgence : {URGENCY_LABELS[req.urgency] ?? req.urgency}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    Soumise le {formatDate(req.createdAt.toISOString())}
                  </span>
                </div>

                <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
                  <div className="space-y-1 md:col-span-8">
                    <h3 className="line-clamp-1 text-sm font-semibold">{req.partDescription}</h3>
                    <p className="text-muted-foreground text-xs">
                      <strong className="text-foreground">Machine :</strong>{' '}
                      {req.machineRef || 'Non spécifiée'} •{' '}
                      <strong className="text-foreground">Quantité :</strong> {req.quantity}{' '}
                      pièce(s) • <strong className="text-foreground">Matière :</strong>{' '}
                      {req.suspectedMaterial || 'Analysée par atelier'}
                    </p>
                  </div>

                  <div className="flex justify-end md:col-span-4">
                    <Link href={`/client/dashboard/demandes/${req.id}`}>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold">
                        Détails & Suivi
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Stepper Status */}
                <div className="pt-2">
                  <PipelineStepper currentStep={req.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
