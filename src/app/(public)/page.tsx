'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Search,
  Hammer,
  Layers,
  Factory,
  Utensils,
  Shirt,
  Package,
  PhoneCall,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden border-b pb-16 pt-12 md:pb-24 md:pt-20">
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

            <h1 className="text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Une pièce cassée ?{' '}
              <span className="bg-gradient-to-r from-primary to-sky-400 bg-clip-text text-transparent">
                Refabriquée à l&apos;identique
              </span>{' '}
              en quelques jours.
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Usinage CNC et reverse engineering de pièces industrielles en plastique technique
              (POM-C, PTFE, PE1000, PA6, PEEK) en Tunisie. Évitez les arrêts de ligne.
            </p>

            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              <Link href="/contact">
                <Button size="lg" className="w-full gap-2 text-base font-bold shadow-md sm:w-auto">
                  Contacter l&apos;Atelier
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-base font-semibold sm:w-auto"
                >
                  Devenir Client Permanent
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-foreground">24-48h</span> délai
                critique
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-primary">±0.02 mm</span> tolérance
                CNC
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-emerald-600">100%</span> matières
                certifiées
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMES + SOLUTION */}
      <section className="container py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-2">
              <Badge variant="outline" className="border-destructive/30 text-destructive">
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
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="mb-1 text-base">Pièce introuvable</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Fabricant disparu, référence obsolète. Nous modélisons en CAO 3D et usinons à
                      l&apos;identique.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    <Hammer className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="mb-1 text-base">Délais d&apos;import bloquants</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      6 à 12 semaines d&apos;attente depuis l&apos;Europe ou l&apos;Asie. Nous
                      fabriquons localement en 24-72h.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="mb-1 text-base">Coûts prohibitifs</CardTitle>
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
              <Badge variant="outline" className="border-primary/30 text-primary">
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
              <div className="absolute bottom-0 left-5 top-0 w-px bg-border" />
              <div className="space-y-6">
                {[
                  {
                    step: '01',
                    title: 'Envoi & Diagnostic',
                    desc: 'Photos, dimensions ou échantillon physique.',
                  },
                  {
                    step: '02',
                    title: 'Recherche Multi-Sources',
                    desc: 'BDD, TraceParts, CADENAS et analyse géométrique IA.',
                  },
                  {
                    step: '03',
                    title: 'Reverse Engineering',
                    desc: 'Relevé dimensionnel et modélisation CAO 3D (STEP).',
                  },
                  {
                    step: '04',
                    title: 'Usinage CNC Précis',
                    desc: 'Tournage ou fraisage dans le plastique technique adapté.',
                  },
                  {
                    step: '05',
                    title: 'Contrôle & Livraison',
                    desc: 'Contrôle MMT et expédition sous 24-72h en Tunisie.',
                  },
                ].map((s) => (
                  <div key={s.step} className="relative flex gap-4">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {s.step}
                    </div>
                    <div className="pt-1.5">
                      <h3 className="text-sm font-semibold">{s.title}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
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
          <div className="mx-auto mb-10 max-w-2xl space-y-3 text-center">
            <Badge variant="outline">Secteurs</Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Partenaire de maintenance des fleurons industriels
            </h2>
            <p className="text-sm text-muted-foreground">
              De Bizerte à Sfax en passant par le Grand Tunis.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { name: 'Agroalimentaire & Boissons', icon: Utensils },
              { name: 'Textile & Confection', icon: Shirt },
              { name: 'Conditionnement & Emballage', icon: Package },
              { name: 'Mécanique & Céramique', icon: Factory },
              { name: 'Chimie & Pharmacie', icon: Factory },
            ].map((sector) => {
              const Icon = sector.icon;
              return (
                <div
                  key={sector.name}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-background p-5 text-center transition-colors hover:border-primary/40"
                >
                  <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-medium leading-snug">{sector.name}</h4>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="container py-16">
        <Card className="border-0 bg-gradient-to-br from-primary/90 via-primary to-blue-700 text-primary-foreground">
          <CardContent className="flex flex-col items-center justify-between gap-6 p-8 sm:p-12 md:flex-row">
            <div className="space-y-2">
              <Badge className="border-none bg-white/20 text-white hover:bg-white/30">
                Intervention Rapide
              </Badge>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Envoyez une photo, on s&apos;occupe du reste.
              </h2>
              <p className="text-sm text-white/80">
                Estimation sous 2 heures. Recherche automatique et matière adaptée.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white font-bold text-primary shadow-md hover:bg-white/90"
                >
                  Devenir Client Permanent
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 font-medium text-white hover:bg-white/10"
                >
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Contact & Atelier
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
