'use client'

import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MATERIALS_CATALOG } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Layers,
  Thermometer,
  ShieldCheck,
  Zap,
  Box,
} from 'lucide-react'

export default function MaterialDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const material = MATERIALS_CATALOG.find((m) => m.slug === params.slug)

  if (!material) {
    notFound()
  }

  return (
    <div className="container py-12 space-y-10">
      <div>
        <Link
          href="/materiaux"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au catalogue des plastiques
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-mono text-primary">
                {material.code}
              </h1>
              <Badge variant="outline" className="text-xs">
                {material.category}
              </Badge>
              {material.foodGrade && (
                <Badge variant="success" className="text-xs">
                  Agréé Contact Alimentaire
                </Badge>
              )}
            </div>
            <p className="text-lg text-muted-foreground">{material.name}</p>
          </div>

          <Link href="/demande">
            <Button className="gap-2 font-bold shadow-md">
              Demander une pièce en {material.code}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description & Comportement Mécanique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>{material.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Principaux Avantages en Usinage & Service</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {material.advantages.map((adv, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {material.commonApplications.map((app, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border bg-muted/30 flex items-center gap-2.5 font-medium"
                  >
                    <Box className="w-4 h-4 text-primary shrink-0" />
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
              <CardTitle className="text-base font-mono uppercase tracking-wider">
                Fiche Métrologique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Densité spécifique</span>
                  <span className="font-bold">{material.density} g/cm³</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Température max continue</span>
                  <span className="font-bold text-amber-500">{material.maxTemp} °C</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Résistance à la traction</span>
                  <span className="font-bold">{material.tensileStrength} MPa</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Dureté</span>
                  <span className="font-bold">{material.hardness}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Coefficient de frottement</span>
                  <span className="font-bold text-emerald-500">µ = {material.frictionCoefficient}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
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
  )
}
