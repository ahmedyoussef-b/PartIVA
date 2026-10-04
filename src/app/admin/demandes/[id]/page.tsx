'use client'

import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { INITIAL_REQUESTS } from '@/lib/mock-data'
import { FR } from '@/i18n/fr'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PipelineStepper } from '@/components/domain/pipeline-stepper'
import {
  ArrowLeft,
  Search,
  Wrench,
  Hammer,
  Boxes,
  FileCheck2,
  Phone,
  Mail,
  Building,
  CheckCircle2,
} from 'lucide-react'

export default function AdminDemandeDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const request = INITIAL_REQUESTS.find((r) => r.id === params.id) || INITIAL_REQUESTS[0]

  if (!request) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <Link
          href="/admin/demandes"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la file des demandes
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-primary">
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
              Reçue de {request.client.company || request.client.name} le {formatDate(request.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/demandes/${request.id}/recherche`}>
              <Button className="gap-2 font-bold shadow-sm">
                <Search className="w-4 h-4" />
                Lancer Recherche Multi-Sources
              </Button>
            </Link>
            <Link href={`/admin/reverse-engineering/${request.id}`}>
              <Button variant="outline" className="gap-2 font-semibold">
                <Wrench className="w-4 h-4" />
                Bascule Reverse CAO
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stepper Card */}
      <Card className="p-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-4">
          Pipeline de Fabrication Actuel
        </h3>
        <PipelineStepper currentStep={request.status} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Cahier des Charges Pièce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-foreground leading-relaxed">{request.partDescription}</p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs font-mono">
                <div>
                  <span className="text-muted-foreground block text-[10px]">MACHINE CLIENT</span>
                  <span className="font-semibold text-foreground">{request.machineRef || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">RÔLE MÉCANIQUE</span>
                  <span className="font-semibold text-foreground">{request.partFunction || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">MATIÈRE SUSPECTÉE</span>
                  <span className="font-bold text-primary">
                    {request.suspectedMaterial || 'Non précisée'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">VOLUME DEMANDÉ</span>
                  <span className="font-bold text-foreground">{request.quantity} pièce(s)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Photos & Documents Reçus</CardTitle>
              <CardDescription>
                Ces photos sont conservées localement dans l’atelier conformément à la politique de confidentialité.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {request.photos.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg border bg-muted overflow-hidden relative group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
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
                <Building className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {request.client.company || 'Société non spécifiée'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 flex items-center justify-center font-bold text-muted-foreground">
                  •
                </span>
                <span>{request.client.name}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href={`mailto:${request.client.email}`} className="text-primary hover:underline">
                  {request.client.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary shrink-0" />
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
                de données SQLite de l’atelier ou dans les bibliothèques TraceParts.
              </p>
              <Link href={`/admin/demandes/${request.id}/recherche`}>
                <Button className="w-full gap-2 text-xs font-bold shadow-xs">
                  <Search className="w-3.5 h-3.5" />
                  Ouvrir l’Écran de Recherche Multi-Sources
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
