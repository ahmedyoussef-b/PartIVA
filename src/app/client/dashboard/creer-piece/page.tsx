'use client';
import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cog, Cpu, ArrowRight } from 'lucide-react';

export default function CreerPieceChoicePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <div className="border-b pb-6">
        <div className="mb-1.5 flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary">
            Espace Client Permanent
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Point d&apos;entrée
          </Badge>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Que souhaitez-vous créer ?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez le parcours adapté à votre projet. Les deux demandes sont ensuite suivies par
          nos équipes.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/client/dashboard/creer-piece/mecanique"
          className="group block"
          onClick={() => console.info('[CLIENT:CHOIX] Sélection du type de demande')}
        >
          <Card className="h-full border-border shadow-sm transition-all group-hover:border-primary/50 group-hover:shadow-md">
            <CardContent className="flex h-full flex-col gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Cog className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold">Je veux fabriquer une pièce mécanique</h2>
                <p className="text-sm text-muted-foreground">
                  Rétro-ingénierie et usinage d&apos;une pièce à partir de photos et de cotes.
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                Créer une demande de pièce
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link
          href="/client/dashboard/creer-piece/pcb"
          className="group block"
          onClick={() => console.info('[CLIENT:CHOIX] Sélection du type de demande')}
        >
          <Card className="h-full border-border shadow-sm transition-all group-hover:border-primary/50 group-hover:shadow-md">
            <CardContent className="flex h-full flex-col gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Cpu className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold">
                  Je veux concevoir une carte électronique (PCB)
                </h2>
                <p className="text-sm text-muted-foreground">
                  Cahier des charges d&apos;une carte électronique : fonction, contraintes et
                  schémas.
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                Créer un cahier des charges PCB
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}