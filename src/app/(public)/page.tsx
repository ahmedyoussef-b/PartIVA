'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MATERIALS_CATALOG } from '@/lib/mock-data'
import {
  ArrowRight,
  Search,
  Hammer,
  Layers,
  Truck,
  Sparkles,
  Factory,
  Utensils,
  Shirt,
  Package,
  PhoneCall,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 md:pb-24 border-b min-h-[90vh] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-cnc-workshop.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/75 to-background" />
        <div className="container relative z-10">
          <div className="max-w-3xl space-y-6">
            <Badge variant="secondary" className="text-xs font-medium">
              Atelier Technique Spécialisé • Fabrication Plastiques à la Demande
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              Une pièce cassée ?{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-400">
                Refabriquée à l&apos;identique
              </span>{' '}
              en quelques jours.
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Usinage CNC et reverse engineering de pièces industrielles en plastique technique
              (POM-C, PTFE, PE1000, PA6, PEEK) en Tunisie. Évitez les arrêts de ligne.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href="/contact">
                <Button size="lg" className="w-full sm:w-auto gap-2 font-bold text-base shadow-md">
                  Contacter l&apos;Atelier
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base font-semibold">
                  Devenir Client Permanent
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-foreground">24-48h</span>{' '}
                délai critique
              </span>
              <span className="w-px h-4 bg-border" />
              <span className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-primary">±0.02 mm</span>{' '}
                tolérance CNC
              </span>
              <span className="w-px h-4 bg-border" />
              <span className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-emerald-600">100%</span>{' '}
                matières certifiées
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMES + SOLUTION */}
      <section className="container py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="space-y-2">
              <Badge variant="outline" className="text-destructive border-destructive/30">
                Le problème
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight">
                Les pièces cassées paralysent votre usine
              </h2>
              <p className="text-muted-foreground">
                Trois impasses majeures que nous résolvons chaque jour pour les directeurs de
                maintenance en Tunisie.
              </p>
            </div>

            <div className="space-y-4">
              <Card className="border-border/60">
                <CardContent className="p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base mb-1">Pièce introuvable</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Fabricant disparu, référence obsolète. Nous modélisons en CAO 3D et usinons à
                      l&apos;identique.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardContent className="p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Hammer className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base mb-1">Délais d&apos;import bloquants</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      6 à 12 semaines d&apos;attente depuis l&apos;Europe ou l&apos;Asie. Nous
                      fabriquons localement en 24-72h.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardContent className="p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base mb-1">Coûts prohibitifs</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Frais de port, douane, marges. Jusqu&apos;à 10x le prix d&apos;une pièce.
                      Fabriqué localement = maîtrisé.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Badge variant="outline" className="text-primary border-primary/30">
                Notre méthode
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight">
                De la pièce usée au composant neuf certifié
              </h2>
              <p className="text-muted-foreground">
                Un processus d&apos;ingénierie rigoureux en 5 étapes.
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {[
                  { step: '01', title: 'Envoi & Diagnostic', desc: 'Photos, dimensions ou échantillon physique.' },
                  { step: '02', title: 'Recherche Multi-Sources', desc: 'BDD, TraceParts, CADENAS et analyse géométrique IA.' },
                  { step: '03', title: 'Reverse Engineering', desc: 'Relevé dimensionnel et modélisation CAO 3D (STEP).' },
                  { step: '04', title: 'Usinage CNC Précis', desc: 'Tournage ou fraisage dans le plastique technique adapté.' },
                  { step: '05', title: 'Contrôle & Livraison', desc: 'Contrôle MMT et expédition sous 24-72h en Tunisie.' },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4 relative">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 relative z-10">
                      {s.step}
                    </div>
                    <div className="pt-1.5">
                      <h3 className="font-semibold text-sm">{s.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTEURS */}
      <section className="border-t bg-muted/20">
        <div className="container py-16">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <Badge variant="outline">Secteurs</Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Partenaire de maintenance des fleurons industriels
            </h2>
            <p className="text-muted-foreground text-sm">
              De Bizerte à Sfax en passant par le Grand Tunis.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: 'Agroalimentaire & Boissons', icon: Utensils },
              { name: 'Textile & Confection', icon: Shirt },
              { name: 'Conditionnement & Emballage', icon: Package },
              { name: 'Mécanique & Céramique', icon: Factory },
              { name: 'Chimie & Pharmacie', icon: Factory },
            ].map((sector) => {
              const Icon = sector.icon
              return (
                <div
                  key={sector.name}
                  className="rounded-xl border bg-background p-5 text-center flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-colors"
                >
                  <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-medium text-xs leading-snug">{sector.name}</h4>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="container py-16">
        <Card className="bg-gradient-to-br from-primary/90 via-primary to-blue-700 border-0 text-primary-foreground">
          <CardContent className="p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">
                Intervention Rapide
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold">
                Envoyez une photo, on s&apos;occupe du reste.
              </h2>
              <p className="text-white/80 text-sm">
                Estimation sous 2 heures. Recherche automatique et matière adaptée.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/register">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold shadow-md">
                  Devenir Client Permanent
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-medium">
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Contact & Atelier
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
