'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ArrowLeft, Search, Phone, Mail, Building, Sparkles, Hammer, FileBox } from 'lucide-react';
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
  const router = useRouter();

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

  const handleSequential = () => {
    router.push(`/admin/demandes/${request.id}/recherche?sequential=1`);
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
        </div>
      </div>

      {/* Panneau de Décision V7 */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Panneau de Décision V7</h2>
          <p className="text-xs text-muted-foreground">
            4 méthodes indépendantes — ou lancer le flux séquentiel
          </p>
        </div>
        <Button onClick={handleSequential} variant="default" size="sm">
          Lancer séquentiel
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer transition-colors hover:border-blue-500/50"
          onClick={() => router.push(`/admin/demandes/${request.id}/recherche`)}
        >
          <CardHeader className="pb-2">
            <div className="mb-2 w-fit rounded-md bg-blue-500/10 p-2">
              <Search className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-sm">Méthode 1 : Catalogue</CardTitle>
            <CardDescription className="text-xs">
              Rechercher une pièce standard (Step.parts, CADENAS, FAPI)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full text-xs">
              Lancer la recherche
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:border-amber-500/50">
          <CardHeader className="pb-2">
            <div className="mb-2 w-fit rounded-md bg-amber-500/10 p-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <CardTitle className="text-sm">MÃ©thode 2 : Workspace IA</CardTitle>
            <CardDescription className="text-xs">
              Analyser les photos et gÃ©nÃ©rer un modÃ¨le 3D automatiquement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full text-xs">
              <Link href={`/workspace?requestId=${request.id}`}>Ouvrir le Workspace</Link>
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:border-violet-500/50"
          onClick={() => router.push(`/admin/reverse-engineering/${request.id}`)}
        >
          <CardHeader className="pb-2">
            <div className="mb-2 w-fit rounded-md bg-violet-500/10 p-2">
              <Hammer className="h-5 w-5 text-violet-500" />
            </div>
            <CardTitle className="text-sm">Méthode 3 : Reverse CAO</CardTitle>
            <CardDescription className="text-xs">
              Modélisation manuelle par l&apos;admin (si l&apos;IA échoue)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full text-xs">
              Ouvrir Reverse
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:border-emerald-500/50">
          <CardHeader className="pb-2">
            <div className="mb-2 w-fit rounded-md bg-emerald-500/10 p-2">
              <FileBox className="h-5 w-5 text-emerald-500" />
            </div>
            <CardTitle className="text-sm">Méthode 4 : Import CAO</CardTitle>
            <CardDescription className="text-xs">
              Importer un fichier STEP/IGES fourni par le client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full text-xs" asChild>
              <Link href={`/admin/demandes/${request.id}/import-cad`}>Importer un fichier CAO</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

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
                {request.photos.map((photo, i) => {
                  // Support ancien format (string) et nouveau (objet {url, tag})
                  const photoUrl = typeof photo === 'string' ? photo : photo.url;
                  const photoTag = typeof photo === 'object' ? photo.tag : null;
                  return (
                    <div
                      key={i}
                      className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={photoTag || `Photo ${i + 1}`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          console.error(`[DEBUG-ADMIN] Erreur chargement image:`, photoUrl);
                          (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        }}
                      />
                      {photoTag && (
                        <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                          {photoTag}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            router.push(
                              `/admin/demandes/${request.id}/recherche?photo=${encodeURIComponent(photoUrl)}`,
                            )
                          }
                        >
                          <Search className="h-3.5 w-3.5" /> Chercher cette photo
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
        </div>
      </div>
    </div>
  );
}
