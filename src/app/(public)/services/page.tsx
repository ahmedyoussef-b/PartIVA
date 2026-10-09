'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScanLine, CheckCircle2, FileCheck, Cpu, Layers, ArrowRight } from 'lucide-react';

export default function ServicesPage() {
  return (
    <div className="container space-y-12 py-12">
      <div className="max-w-3xl space-y-3">
        <Badge variant="outline">Expertise Atelier & Usinage</Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Nos Services d’Usinage & Rétro-Ingénierie
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Nous couvrons l’intégralité de la chaîne de valeur : du diagnostic de défaillance
          mécanique d’une pièce cassée jusqu’à l’usinage de précision sur machines CNC de dernière
          génération.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="border-border/60 p-2">
          <CardHeader>
            <div className="bg-primary/10 text-primary mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
              <ScanLine className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">1. Rétro-Ingénierie (Reverse Engineering CAO)</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4 text-sm leading-relaxed">
            <p>
              À partir d’un morceau de pièce brisée, usée ou déformée, nous effectuons un relevé
              métrologique complet (pied à coulisse digital, micromètre, comparateur ou bras de
              mesure 3D).
            </p>
            <ul className="text-foreground space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Reconstitution des géométries
                d’origine
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Export des fichiers au format
                standard STEP / IGES
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Plan 2D côté avec tolérances
                d’ajustement (H7, g6)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/60 p-2">
          <CardHeader>
            <div className="bg-primary/10 text-primary mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
              <Cpu className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">2. Tournage & Fraisage CNC 3 à 5 Axes</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4 text-sm leading-relaxed">
            <p>
              Notre parc machine comprend des tours numériques et des centres d’usinage verticaux
              spécialement équipés d’outils carbure dédiés aux thermoplastiques (évacuation copeaux
              et refroidissement air sec).
            </p>
            <ul className="text-foreground space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Diamètre de tournage jusqu’à
                Ø330 mm
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Fraisage de formes complexes
                et cames 3D
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> États de surface impeccables
                sans bavure
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/60 p-2">
          <CardHeader>
            <div className="bg-primary/10 text-primary mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
              <Layers className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">3. Conseil & Substitution Matière</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4 text-sm leading-relaxed">
            <p>
              Votre pièce casse trop souvent ? Nous analysons la cause de la rupture (choc, fatigue,
              échauffement, attaque chimique) et proposons une matière plus performante.
            </p>
            <ul className="text-foreground space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Remplacement du bronze par du
                POM-C ou UHMW-PE
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Réduction de 60% du poids des
                pièces mobiles
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Suppression des opérations de
                graissage polluantes
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/60 p-2">
          <CardHeader>
            <div className="bg-primary/10 text-primary mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
              <FileCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">4. Contrôle Qualité Métrologique Certifié</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4 text-sm leading-relaxed">
            <p>
              Chaque pièce usinée dans notre atelier fait l’objet d’un contrôle dimensionnel
              rigoureux avant expédition pour garantir un montage immédiat sans retouche.
            </p>
            <ul className="text-foreground space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Rapport de contrôle
                métrologique joint au colis
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Certificats matière d’origine
                européenne
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Traçabilité totale par numéro
                de lot de fabrication
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="bg-primary/5 flex flex-col items-center justify-between gap-6 rounded-2xl border p-8 sm:flex-row">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">Besoin d’une fabrication urgente ?</h3>
          <p className="text-muted-foreground text-sm">
            Nos équipes techniques traitent les demandes d’arrêt de ligne sous 24h.
          </p>
        </div>
        <Link href="/demande">
          <Button className="gap-2 font-bold shadow-md">
            Lancer une demande <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
