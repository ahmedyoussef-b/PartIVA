'use client'

import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { INITIAL_REQUESTS } from '@/lib/mock-data'
import { FR } from '@/i18n/fr'
import { formatDate } from '@/lib/utils'
import { PipelineStepper } from '@/components/domain/pipeline-stepper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Cpu,
  Layers,
  Phone,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'

export default function ClientDemandeDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const request = INITIAL_REQUESTS.find((r) => r.id === params.id) || INITIAL_REQUESTS[0]

  if (!request) {
    notFound()
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <Link
          href="/client/dashboard/demandes"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la liste des demandes
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl sm:text-2xl font-bold text-primary">
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
              <Phone className="w-3.5 h-3.5 text-primary" />
              Contacter l’atelier pour ce dossier
            </Button>
          </a>
        </div>
      </div>

      {/* Stepper Card */}
      <Card className="border-border/60 p-6 bg-card/60 backdrop-blur">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-4">
          Progression de fabrication en atelier
        </h3>
        <PipelineStepper currentStep={request.status} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Description de la Pièce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p className="text-foreground">{request.partDescription}</p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">MACHINE CONCERNÉE</span>
                  <span className="font-medium text-foreground">{request.machineRef || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">FONCTION MÉCANIQUE</span>
                  <span className="font-medium text-foreground">{request.partFunction || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">MATIÈRE ANALYSÉE</span>
                  <span className="font-mono font-semibold text-primary">
                    {request.suspectedMaterial || 'En cours d’analyse'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">QUANTITÉ COMMANDE</span>
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
              <CardTitle className="text-base font-semibold">Photos & Échantillons Transmis</CardTitle>
              <CardDescription>
                Prises de vue utilisées pour le dimensionnement et la recherche d’équivalences CAO.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {request.photos.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg border bg-muted overflow-hidden relative"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo pièce ${i + 1}`}
                      className="w-full h-full object-cover"
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
                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Demande tirée en local</div>
                    <p className="text-muted-foreground">Synchronisation atelier SQLite réussie.</p>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatDate(request.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Recherche multi-sources lancée</div>
                    <p className="text-muted-foreground">TraceParts, CADENAS et BDD locale interrogés.</p>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatDate(request.updatedAt)}
                    </span>
                  </div>
                </div>

                {request.status === 'reverse_engineering' && (
                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-amber-500">Rétro-Ingénierie CAO en cours</div>
                      <p className="text-muted-foreground">Relevé des cotes au pied à coulisse digital.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
