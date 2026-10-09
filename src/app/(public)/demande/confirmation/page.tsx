'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Phone, FileText, RotateCcw } from 'lucide-react';

function DemandeConfirmationContent() {
  const searchParams = useSearchParams();
  const reqId = searchParams?.get('id') || 'REQ-2026-1043';

  return (
    <div className="container max-w-2xl space-y-8 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
        <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
      </div>

      <div className="space-y-3">
        <Badge variant="success" className="font-mono text-xs">
          Demande Enregistrée avec Succès
        </Badge>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Votre demande est en cours de traitement
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-sm">
          Nos ingénieurs méthodes ont reçu vos photos et commencent la recherche multi-sources et
          l’analyse dimensionnelle de la pièce.
        </p>
      </div>

      <Card className="border-border/60 bg-card/60 text-left backdrop-blur">
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase">
              Référence du dossier
            </span>
            <span className="text-primary font-mono text-sm font-bold">{reqId}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-sm">
          <div className="space-y-3">
            <h4 className="text-muted-foreground text-xs font-semibold uppercase">
              Prochaines étapes :
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold">
                  1
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  <strong className="text-foreground">Recherche automatisée (15 min) :</strong>{' '}
                  Comparaison avec nos 50 000 modèles 3D indexés et bibliothèques
                  TraceParts/CADENAS.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold">
                  2
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  <strong className="text-foreground">Validation matière & faisabilité :</strong>{' '}
                  Confirmation du plastique (POM-C, PTFE, PE1000) et tolérances d’usinage requises.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold">
                  3
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  <strong className="text-foreground">Devis & Lancement :</strong> Envoi du devis
                  sous 2h ouvrées et mise en fabrication sur nos tours/fraiseuses CNC.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
            <Phone className="h-4 w-4 shrink-0" />
            <span>
              Pour un <strong>arrêt de ligne critique</strong>, appelez directement l’atelier au{' '}
              <strong>+216 74 123 456</strong> avec le numéro de référence.
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
        <Link href="/client/dashboard/demandes">
          <Button variant="default" className="w-full gap-2 font-semibold sm:w-auto">
            <FileText className="h-4 w-4" />
            Suivre ma demande dans l’espace client
          </Button>
        </Link>
        <Link href="/demande">
          <Button variant="outline" className="w-full gap-2 sm:w-auto">
            <RotateCcw className="h-4 w-4" />
            Soumettre une autre pièce
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function DemandeConfirmationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="text-muted-foreground container max-w-2xl py-16 text-center text-sm">
          Chargement de la confirmation...
        </div>
      }
    >
      <DemandeConfirmationContent />
    </React.Suspense>
  );
}
