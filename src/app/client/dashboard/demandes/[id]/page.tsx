'use client';

import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { INITIAL_REQUESTS } from '@/lib/mock-data';
import { FR } from '@/i18n/fr';
import { formatDate } from '@/lib/utils';
import { PipelineStepper } from '@/components/domain/pipeline-stepper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Phone, CheckCircle2 } from 'lucide-react';

export default function ClientDemandeDetailPage({ params }: { params: { id: string } }) {
  const request = INITIAL_REQUESTS.find((r) => r.id === params.id) || INITIAL_REQUESTS[0];

  if (!request) {
    notFound();
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <Link
          href="/client/dashboard/demandes"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la liste des demandes
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-primary sm:text-2xl">
                {request.cloudId ? `#REQ-${request.cloudId}` : request.id.slice(0, 8)}
              </span>
              <Badge
                variant={request.urgency === 'critical' ? 'critical' : 'outline'}
                className="text-xs"
              >
                {FR.urgencies[request.urgency]}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {FR.statuses[request.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Demande enregistrée le {formatDate(request.createdAt)}
            </p>
          </div>

          <a href="tel:+21674123456">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Phone className="h-3.5 w-3.5 text-primary" />
              Contacter l’atelier pour ce dossier
            </Button>
          </a>
        </div>
      </div>

      {/* Stepper Card */}
      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
        <h3 className="mb-4 text-xs font-semibold uppercase text-muted-foreground">
          Progression de fabrication en atelier
        </h3>
        <PipelineStepper currentStep={request.status} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Description de la Pièce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p className="text-foreground">{request.partDescription}</p>

              <div className="grid grid-cols-2 gap-4 border-t pt-4 text-xs">
                <div>
                  <span className="block text-[11px] text-muted-foreground">MACHINE CONCERNÉE</span>
                  <span className="font-medium text-foreground">{request.machineRef || '—'}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">
                    FONCTION MÉCANIQUE
                  </span>
                  <span className="font-medium text-foreground">{request.partFunction || '—'}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">MATIÈRE ANALYSÉE</span>
                  <span className="font-mono font-semibold text-primary">
                    {request.suspectedMaterial || 'En cours d’analyse'}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">QUANTITÉ COMMANDE</span>
                  <span className="font-mono font-bold text-foreground">
                    {request.quantity} unité(s)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Photos & Échantillons Transmis
              </CardTitle>
              <CardDescription>
                Prises de vue utilisées pour le dimensionnement et la recherche d’équivalences CAO.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {request.photos.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo pièce ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Events */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Journal des Événements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Demande tirée en local</div>
                    <p className="text-muted-foreground">Synchronisation atelier SQLite réussie.</p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      Recherche multi-sources lancée
                    </div>
                    <p className="text-muted-foreground">
                      TraceParts, CADENAS et BDD locale interrogés.
                    </p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatDate(request.updatedAt)}
                    </span>
                  </div>
                </div>

                {request.status === 'reverse_engineering' && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-amber-500">
                        Rétro-Ingénierie CAO en cours
                      </div>
                      <p className="text-muted-foreground">
                        Relevé des cotes au pied à coulisse digital.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
