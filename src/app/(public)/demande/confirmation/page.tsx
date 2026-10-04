'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Clock,
  Phone,
  ArrowRight,
  FileText,
  Search,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'

function DemandeConfirmationContent() {
  const searchParams = useSearchParams()
  const reqId = searchParams?.get('id') || 'REQ-2026-1043'

  return (
    <div className="container max-w-2xl py-16 space-y-8 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
        <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
      </div>

      <div className="space-y-3">
        <Badge variant="success" className="font-mono text-xs">
          Demande Enregistrée avec Succès
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Votre demande est en cours de traitement
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Nos ingénieurs méthodes ont reçu vos photos et commencent la recherche multi-sources et
          l’analyse dimensionnelle de la pièce.
        </p>
      </div>

      <Card className="border-border/60 bg-card/60 backdrop-blur text-left">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              Référence du dossier
            </span>
            <span className="font-mono text-sm font-bold text-primary">{reqId}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-sm">
          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase text-muted-foreground">
              Prochaines étapes :
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Recherche automatisée (15 min) :</strong> Comparaison
                  avec nos 50 000 modèles 3D indexés et bibliothèques TraceParts/CADENAS.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Validation matière & faisabilité :</strong> Confirmation du
                  plastique (POM-C, PTFE, PE1000) et tolérances d’usinage requises.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Devis & Lancement :</strong> Envoi du devis sous 2h
                  ouvrées et mise en fabrication sur nos tours/fraiseuses CNC.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/30 flex items-center gap-3 text-xs text-amber-700 dark:text-amber-400">
            <Phone className="w-4 h-4 shrink-0" />
            <span>
              Pour un <strong>arrêt de ligne critique</strong>, appelez directement l’atelier au{' '}
              <strong>+216 74 123 456</strong> avec le numéro de référence.
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link href="/client/dashboard/demandes">
          <Button variant="default" className="w-full sm:w-auto gap-2 font-semibold">
            <FileText className="w-4 h-4" />
            Suivre ma demande dans l’espace client
          </Button>
        </Link>
        <Link href="/demande">
          <Button variant="outline" className="w-full sm:w-auto gap-2">
            <RotateCcw className="w-4 h-4" />
            Soumettre une autre pièce
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function DemandeConfirmationPage() {
  return (
    <React.Suspense fallback={<div className="container max-w-2xl py-16 text-center text-sm text-muted-foreground">Chargement de la confirmation...</div>}>
      <DemandeConfirmationContent />
    </React.Suspense>
  )
}
