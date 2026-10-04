'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PipelineStepper } from '@/components/domain/pipeline-stepper'
import { INITIAL_REQUESTS } from '@/lib/mock-data'
import { FR } from '@/i18n/fr'
import { formatDate } from '@/lib/utils'
import {
  FileText,
  Clock,
  Hammer,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  Camera,
  AlertTriangle,
  Layers,
} from 'lucide-react'

export default function ClientDashboardPage() {
  const requests = INITIAL_REQUESTS

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Espace Maintenance & Commandes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Suivez la numérisation CAO, l’usinage et l’expédition de vos pièces industrielles.
          </p>
        </div>
        <Link href="/demande">
          <Button className="gap-2 font-bold shadow-md">
            <PlusCircle className="w-4 h-4" />
            Demander une refabrication
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Demandes actives</span>
            <FileText className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black font-mono">3</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Dont 1 arrêt de ligne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Usinage en cours</span>
            <Hammer className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black font-mono text-amber-500">1</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tour CNC Haas ST-20</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pièces livrées</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black font-mono text-emerald-500">14</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Année en cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Délai moyen constaté</span>
            <Clock className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black font-mono">3.4 j</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">vs 8 semaines import</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Requests List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Vos demandes en cours de traitement</h2>
          <Link
            href="/client/dashboard/demandes"
            className="text-xs text-primary hover:underline font-semibold"
          >
            Voir l’historique complet →
          </Link>
        </div>

        <div className="space-y-4">
          {requests.slice(0, 3).map((req) => (
            <Card key={req.id} className="hover:border-primary/50 transition-all">
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-primary">
                      {req.cloudId ? `#REQ-${req.cloudId}` : req.id.slice(0, 8)}
                    </span>
                    <Badge
                      variant={req.urgency === 'critical' ? 'critical' : 'outline'}
                      className="text-[10px]"
                    >
                      Urgence : {FR.urgencies[req.urgency]}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Soumise le {formatDate(req.createdAt)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 space-y-1">
                    <h3 className="font-semibold text-sm line-clamp-1">{req.partDescription}</h3>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Machine :</strong> {req.machineRef || 'Non spécifiée'} •{' '}
                      <strong className="text-foreground">Quantité :</strong> {req.quantity} pièce(s) •{' '}
                      <strong className="text-foreground">Matière :</strong>{' '}
                      {req.suspectedMaterial || 'Analysée par atelier'}
                    </p>
                  </div>

                  <div className="md:col-span-4 flex justify-end">
                    <Link href={`/client/dashboard/demandes/${req.id}`}>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold">
                        Détails & Suivi
                        <ArrowRight className="w-3.5 h-3.5" />
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
  )
}
