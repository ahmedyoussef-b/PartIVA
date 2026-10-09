'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Hammer, ArrowRight, Camera, Truck, Wrench } from 'lucide-react';

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
  ];

  return (
    <div className="container space-y-12 py-12">
      <div className="max-w-3xl space-y-3">
        <Badge variant="outline">Le Flux Métier</Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">Comment ça marche ?</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          De votre photo prise sur votre smartphone jusqu’à la réception d’une pièce neuve usinée
          aux tolérances exactes de votre machine.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.num}
              className="bg-card/60 hover:border-primary/40 flex flex-col gap-6 rounded-2xl border p-6 transition-colors md:flex-row"
            >
              <div className="flex shrink-0 items-center gap-4 md:w-28 md:flex-col md:items-center md:justify-center">
                <span className="text-primary font-mono text-4xl font-black">{st.num}</span>
                <div className="bg-primary/10 text-primary rounded-xl p-3">
                  <Icon className="h-6 w-6" />
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {st.tag}
                  </Badge>
                </div>
                <h3 className="text-foreground text-xl font-bold">{st.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{st.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="py-6 text-center">
        <Link href="/demande">
          <Button size="lg" className="gap-2 font-bold shadow-lg">
            Démarrer ma demande de pièce maintenant
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
