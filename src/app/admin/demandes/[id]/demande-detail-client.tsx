'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PipelineStepper } from '@/components/domain/pipeline-stepper';
import { ArrowLeft, Search, Wrench, Phone, Mail, Building } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { mapRequestToUi, type RequestWithRelations } from '@/lib/utils/request-mappers';
import { FR } from '@/i18n/fr';
import { updateRequestStatus, updateRequestUrgency } from '@/lib/actions/requests';
import { useTransition } from 'react';
import type { RequestStatus, RequestUrgency } from '@/schemas/request';

const REQUEST_STATUSES: { value: RequestStatus; label: string }[] = [
  { value: 'new', label: 'Nouvelle demande' },
  { value: 'searching', label: 'Recherche multi-sources' },
  { value: 'candidate_found', label: 'Candidat identifié (≥ 70%)' },
  { value: 'reverse_engineering', label: 'Rétro-ingénierie CAO' },
  { value: 'validated', label: 'Validée pour usinage' },
  { value: 'machining', label: 'Usinage CNC en cours' },
  { value: 'completed', label: 'Terminée & Contrôlée' },
  { value: 'archived', label: 'Archivée' },
  { value: 'rejected', label: 'Refusée' },
];

const URGENCIES: { value: RequestUrgency; label: string }[] = [
  { value: 'low', label: 'Standard (7-10 jours ouvrés)' },
  { value: 'normal', label: 'Normale (4-6 jours ouvrés)' },
  { value: 'high', label: 'Haute (48-72h)' },
  { value: 'critical', label: 'Critique / Arrêt de ligne usine (24h)' },
];

interface DemandeDetailClientProps {
  initialRequest: RequestWithRelations;
}

export default function DemandeDetailClient({ initialRequest }: DemandeDetailClientProps) {
  const request = mapRequestToUi(initialRequest);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: RequestStatus) => {
    startTransition(async () => {
      const result = await updateRequestStatus({ id: request.id, status });
      if (!result.success) {
        alert(result.error || 'Erreur lors de la mise à jour du statut');
      }
    });
  };

  const handleUrgencyChange = (urgency: RequestUrgency) => {
    startTransition(async () => {
      const result = await updateRequestUrgency({ id: request.id, urgency });
      if (!result.success) {
        alert(result.error || "Erreur lors de la mise à jour de l'urgence");
      }
    });
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <Link
          href="/admin/demandes"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la file des demandes
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-primary">
                {request.id.slice(0, 8)}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 gap-1 p-2 text-xs">
                    <Badge
                      variant={request.urgency === 'critical' ? 'critical' : 'outline'}
                      className="text-xs"
                    >
                      {FR.urgencies[request.urgency]}
                    </Badge>
                    {isPending && <span className="text-[10px] text-muted-foreground">...</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {URGENCIES.map((u) => (
                    <DropdownMenuItem
                      key={u.value}
                      onClick={() => handleUrgencyChange(u.value)}
                      className="text-xs"
                    >
                      {u.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 gap-1 p-2 text-xs">
                    <Badge variant="secondary" className="text-xs">
                      {FR.statuses[request.status]}
                    </Badge>
                    {isPending && <span className="text-[10px] text-muted-foreground">...</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {REQUEST_STATUSES.map((s) => (
                    <DropdownMenuItem
                      key={s.value}
                      onClick={() => handleStatusChange(s.value)}
                      className="text-xs"
                    >
                      {s.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-sm text-muted-foreground">
              Reçue de {request.client.company || request.client.name} le{' '}
              {formatDate(request.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/demandes/${request.id}/recherche`}>
              <Button className="gap-2 font-bold shadow-sm">
                <Search className="h-4 w-4" />
                Lancer Recherche Multi-Sources
              </Button>
            </Link>
            <Link href={`/admin/reverse-engineering/${request.id}`}>
              <Button variant="outline" className="gap-2 font-semibold">
                <Wrench className="h-4 w-4" />
                Bascule Reverse CAO
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stepper Card */}
      <Card className="p-6">
        <h3 className="mb-4 text-xs font-semibold uppercase text-muted-foreground">
          Pipeline de Fabrication Actuel
        </h3>
        <PipelineStepper currentStep={request.status} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Cahier des Charges Pièce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="leading-relaxed text-foreground">{request.partDescription}</p>

              <div className="grid grid-cols-2 gap-4 border-t pt-4 font-mono text-xs">
                <div>
                  <span className="block text-[10px] text-muted-foreground">MACHINE CLIENT</span>
                  <span className="font-semibold text-foreground">{request.machineRef || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground">RÔLE MÉCANIQUE</span>
                  <span className="font-semibold text-foreground">
                    {request.partFunction || '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground">MATIÈRE SUSPECTÉE</span>
                  <span className="font-bold text-primary">
                    {request.suspectedMaterial || 'Non précisée'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground">VOLUME DEMANDÉ</span>
                  <span className="font-bold text-foreground">{request.quantity} pièce(s)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Photos & Documents Reçus</CardTitle>
              <CardDescription>
                Ces photos sont conservées localement dans l&apos;atelier conformément à la
                politique de confidentialité.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {request.photos.map((url, i) => (
                  <div
                    key={i}
                    className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client details & actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Coordonnées du Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Building className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-semibold text-foreground">
                  {request.client.company || 'Société non spécifiée'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-4 w-4 items-center justify-center font-bold text-muted-foreground">
                  •
                </span>
                <span>{request.client.name}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href={`mailto:${request.client.email}`} className="text-primary hover:underline">
                  {request.client.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href={`tel:${request.client.phone}`} className="font-mono">
                  {request.client.phone || 'Non renseigné'}
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/40 bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Prochaine Action Recommandée</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                Lancer le moteur de recherche pour vérifier si la géométrie existe déjà dans la base
                de données SQLite de l&apos;atelier ou dans les bibliothèques TraceParts.
              </p>
              <Link href={`/admin/demandes/${request.id}/recherche`}>
                <Button className="shadow-xs w-full gap-2 text-xs font-bold">
                  <Search className="h-3.5 w-3.5" />
                  Ouvrir l&apos;Écran de Recherche Multi-Sources
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
