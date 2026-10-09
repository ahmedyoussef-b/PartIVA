import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMaterialBySlug } from '@/lib/data/materials';
import { getMaterialCategoryLabel } from '@/lib/enum-labels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, CheckCircle2, Box } from 'lucide-react';

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const material = await getMaterialBySlug(slug);

  if (!material) {
    notFound();
  }

  return (
    <div className="container space-y-10 py-12">
      <div>
        <Link
          href="/materiaux"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-xs transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au catalogue des plastiques
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-primary font-mono text-3xl font-black tracking-tight sm:text-4xl">
                {material.code}
              </h1>
              <Badge variant="outline" className="text-xs">
                {getMaterialCategoryLabel(material.category)}
              </Badge>
              {material.foodGrade && (
                <Badge variant="success" className="text-xs">
                  Agréé Contact Alimentaire
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-lg">{material.name}</p>
          </div>

          <Link href="/demande">
            <Button className="gap-2 font-bold shadow-md">
              Demander une pièce en {material.code}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Details */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description & Comportement Mécanique</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4 text-sm leading-relaxed">
              <p>{material.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Principaux Avantages en Usinage & Service</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {material.advantages.map((adv, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-foreground">{adv}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Applications Types en Usine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {material.commonApplications.map((app, idx) => (
                  <div
                    key={idx}
                    className="bg-muted/30 flex items-center gap-2.5 rounded-lg border p-3 font-medium"
                  >
                    <Box className="text-primary h-4 w-4 shrink-0" />
                    <span>{app}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Properties Box */}
        <div className="space-y-6">
          <Card className="border-primary/40 bg-card/80">
            <CardHeader>
              <CardTitle className="font-mono text-base tracking-wider uppercase">
                Fiche Métrologique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b py-1.5">
                  <span className="text-muted-foreground">Densité spécifique</span>
                  <span className="font-bold">{material.density} g/cm³</span>
                </div>
                <div className="flex justify-between border-b py-1.5">
                  <span className="text-muted-foreground">Température max continue</span>
                  <span className="font-bold text-amber-500">{material.maxTemp} °C</span>
                </div>
                <div className="flex justify-between border-b py-1.5">
                  <span className="text-muted-foreground">Résistance à la traction</span>
                  <span className="font-bold">{material.tensileStrength} MPa</span>
                </div>
                <div className="flex justify-between border-b py-1.5">
                  <span className="text-muted-foreground">Dureté</span>
                  <span className="font-bold">{material.hardness}</span>
                </div>
                <div className="flex justify-between border-b py-1.5">
                  <span className="text-muted-foreground">Coefficient de frottement</span>
                  <span className="font-bold text-emerald-500">
                    µ = {material.frictionCoefficient}
                  </span>
                </div>
                <div className="flex justify-between border-b py-1.5">
                  <span className="text-muted-foreground">Résistance chimique</span>
                  <span className="font-bold">{material.resistanceChemical}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Contact alimentaire</span>
                  <span className="font-bold">
                    {material.foodGrade ? 'Conforme CE/FDA' : 'Non homologué'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/demande">
                  <Button className="w-full font-bold shadow-sm">
                    Lancer un devis avec ce matériau
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
