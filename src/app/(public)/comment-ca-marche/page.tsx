'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ScanLine,
  Database,
  Search,
  Hammer,
  FileCheck2,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Layers,
  Wrench,
} from 'lucide-react'

export default function CommentCaMarchePage() {
  const steps = [
    {
      num: '1',
      title: 'Soumission en ligne avec photos de la pièce',
      desc: 'Prenez 2 ou 3 photos nettes de votre pièce cassée ou usée sous plusieurs angles. Indiquez la machine d’origine, les dimensions approximatives et votre degré d’urgence.',
      icon: Camera,
      tag: 'Côté Client',
    },
    {
      num: '2',
      title: 'Prise en charge locale & recherche multi-sources',
      desc: 'Notre moteur d’ingénierie synchronise la demande et recherche simultanément dans notre BDD d’atelier, les bibliothèques TraceParts, CADENAS et nos catalogues constructeurs indexés.',
      icon: Search,
      tag: 'Orchestration Atelier',
    },
    {
      num: '3',
      title: 'Correspondance immédiate OU Rétro-Ingénierie',
      desc: 'Si un modèle compatible existe à plus de 70%, il est validé instantanément. Sinon, nous effectuons le reverse engineering : relevé métrologique au micron, calcul de dentures ou pas de vis, et modélisation CAO 3D (STEP).',
      icon: Wrench,
      tag: 'Bureau d’Études',
    },
    {
      num: '4',
      title: 'Usinage CNC & Contrôle dimensionnel',
      desc: 'La pièce est usinée sur tour ou centre d’usinage numérique dans le bloc de plastique technique requis (POM-C, PTFE, PE1000). Elle passe ensuite au contrôle qualité sur MMT tridimensionnelle.',
      icon: Hammer,
      tag: 'Atelier de Fabrication',
    },
    {
      num: '5',
      title: 'Livraison express partout en Tunisie',
      desc: 'Expédition sous 24h à 72h selon l’urgence (possibilité de livraison express le jour même pour arrêt de ligne critique). Prête à monter sur votre machine.',
      icon: Truck,
      tag: 'Expédition',
    },
  ]

  return (
    <div className="container py-12 space-y-12">
      <div className="max-w-3xl space-y-3">
        <Badge variant="outline">Le Flux Métier</Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Comment ça marche ?
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          De votre photo prise sur votre smartphone jusqu’à la réception d’une pièce neuve usinée aux
          tolérances exactes de votre machine.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((st) => {
          const Icon = st.icon
          return (
            <div
              key={st.num}
              className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl border bg-card/60 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-4 md:flex-col md:items-center md:justify-center md:w-28 shrink-0">
                <span className="text-4xl font-black font-mono text-primary">{st.num}</span>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {st.tag}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-foreground">{st.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{st.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center py-6">
        <Link href="/demande">
          <Button size="lg" className="gap-2 font-bold shadow-lg">
            Démarrer ma demande de pièce maintenant
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
