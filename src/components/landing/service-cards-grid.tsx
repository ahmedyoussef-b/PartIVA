'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Wrench,
  RotateCcw,
  Boxes,
  ShieldCheck,
  Gauge,
  Zap,
  ArrowRight,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';

export interface ServiceItem {
  id: string;
  icon: LucideIcon;
  title: string;
  category: string;
  description: string;
  href: string;
  features: string[];
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'cnc-machining',
    icon: Wrench,
    category: 'Fabrication Sur Mesure',
    title: 'Usinage CNC Haute Précision',
    description:
      'Tournage et fraisage 5 axes spécialisés dans les polymères industriels. Tolérances strictes jusqu’à ±0.02 mm pour pièces unitaires ou séries.',
    href: '/services#cnc',
    features: ['Tolérance ±0.02 mm', 'Tournage & Fraisage 5 axes', 'Finitions lisses sans bavure'],
  },
  {
    id: 'reverse-engineering',
    icon: RotateCcw,
    category: 'Remplacement Direct',
    title: 'Rétro-Ingénierie & Scanner 3D',
    description:
      'Reconstitution métrologique exacte à partir d’une pièce cassée ou usée. Modélisation CAO 3D complète même sans plan constructeur initial.',
    href: '/services#retro',
    features: [
      'Scan optique sub-millimétrique',
      'Plans STEP/IGES livrés',
      'Optimisation géométrique',
    ],
  },
  {
    id: 'rapid-prototyping',
    icon: Boxes,
    category: 'Développement Produit',
    title: 'Prototypage Rapide & Séries',
    description:
      'Validation fonctionnelle rapide avant mise en production. Fabrication de pièces échantillons sous 48h avec validation matière en situation réelle.',
    href: '/services#prototypage',
    features: [
      'Échantillon test sous 48h',
      'Duplication de pièces rares',
      'Petites & moyennes séries',
    ],
  },
  {
    id: 'technical-plastics',
    icon: ShieldCheck,
    category: 'Matériaux Spécialisés',
    title: 'Plastiques Techniques Certifiés',
    description:
      'Expertise complète sur POM-C, PTFE (Téflon), PEEK, UHMW-PE 1000 et PA6. Conseils matière sur mesure selon contraintes chimiques, thermiques et d’usure.',
    href: '/materiaux',
    features: [
      'Agréments contact alimentaire CE',
      'Tenue jusqu’à 260°C (PEEK)',
      'Résistance chimique & frottement',
    ],
  },
  {
    id: 'quality-control',
    icon: Gauge,
    category: 'Contrôle Qualité',
    title: 'Métrologie & Contrôle Qualité',
    description:
      'Chaque composant usiné fait l’objet d’un contrôle dimensionnel rigoureux au micromètre et au comparateur avant son expédition en usine.',
    href: '/services#qualite',
    features: [
      'Rapport de contrôle fourni',
      'Traçabilité matière garantie',
      'Validation fonctionnelle',
    ],
  },
  {
    id: 'emergency-breakdown',
    icon: Zap,
    category: 'Intervention Rapide',
    title: 'Dépannage Ligne de Production',
    description:
      'Prise en charge prioritaire pour les pannes bloquantes d’usine. Production d’urgence sous 24 à 48 heures pour minimiser vos pertes d’exploitation.',
    href: '/demande',
    features: ['Prise en charge immédiate', 'Livraison urgente sur site', 'Disponibilité 6j/7'],
  },
];

interface ServiceCardsGridProps {
  badgeText?: string;
  title?: string;
  titleHighlight?: string;
  subtitle?: string;
  services?: ServiceItem[];
}

export function ServiceCardsGrid({
  badgeText = 'Notre Savoir-Faire Industriel',
  title = 'Solutions Complètes pour vos',
  titleHighlight = 'Composants Critiques',
  subtitle = 'De la numérisation 3D d’une pièce cassée à l’usinage de précision de séries industrielles, nous assurons la continuité de votre outil de production.',
  services = DEFAULT_SERVICES,
}: ServiceCardsGridProps) {
  return (
    <section className="bg-tech-surface-subtle text-tech-text-heading border-tech-border/80 relative border-t py-20 lg:py-28">
      {/* Decorative subtle background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
        <div className="bg-tech-primary/5 absolute top-1/2 -left-64 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-tech-accent/5 absolute -right-64 -bottom-32 h-96 w-96 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <div className="bg-tech-primary/10 border-tech-primary/20 text-tech-primary inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wider uppercase">
            <span>{badgeText}</span>
          </div>

          <h2 className="font-heading text-tech-navy text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {title}{' '}
            <span className="from-tech-primary via-tech-accent to-tech-navy bg-gradient-to-r bg-clip-text text-transparent">
              {titleHighlight}
            </span>
          </h2>

          <p className="text-tech-text-body mx-auto max-w-2xl font-sans text-base leading-relaxed sm:text-lg">
            {subtitle}
          </p>
        </div>

        {/* 6 Cards Responsive Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const IconComponent = service.icon;

            return (
              <div
                key={service.id}
                className="group rounded-tech-card border-tech-border shadow-tech hover:shadow-tech-hover hover:border-tech-primary relative flex flex-col justify-between overflow-hidden border bg-white p-8 transition-all duration-300 hover:-translate-y-2"
              >
                {/* Top Subtle Hover Accent Bar */}
                <div className="from-tech-primary via-tech-accent to-tech-primary-light absolute top-0 right-0 left-0 h-1 bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="space-y-6">
                  {/* Icon and Category Tag */}
                  <div className="flex items-center justify-between">
                    <div className="bg-tech-primary/10 border-tech-primary/20 text-tech-primary group-hover:bg-tech-primary group-hover:shadow-tech-glow flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:text-white">
                      <IconComponent className="h-8 w-8 transition-transform duration-300 group-hover:scale-110" />
                    </div>

                    <span className="bg-tech-surface-subtle border-tech-border text-tech-text-muted rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider uppercase">
                      {service.category}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2.5">
                    <h3 className="font-heading text-tech-navy group-hover:text-tech-primary text-xl font-bold transition-colors duration-200">
                      {service.title}
                    </h3>
                    <p className="text-tech-text-body font-sans text-sm leading-relaxed sm:text-base">
                      {service.description}
                    </p>
                  </div>

                  {/* Key Feature Bullets */}
                  <ul className="border-tech-border/60 space-y-2 border-t pt-2">
                    {service.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className="text-tech-text-body/90 flex items-center gap-2 text-xs font-medium"
                      >
                        <span className="bg-tech-accent h-1.5 w-1.5 shrink-0 rounded-full transition-transform group-hover:scale-125" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Footer Link */}
                <div className="border-tech-border/60 mt-6 border-t pt-6">
                  <Link
                    href={service.href}
                    className="text-tech-primary group-hover:text-tech-accent inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-200"
                  >
                    <span>En savoir plus</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner CTA */}
        <div className="rounded-tech-card bg-tech-navy shadow-tech-lg mt-16 flex flex-col items-center justify-between gap-6 border border-white/10 p-8 text-white md:flex-row">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="font-heading text-xl font-bold sm:text-2xl">
              Vous avez un plan 2D, un fichier STEP ou une pièce modèle ?
            </h4>
            <p className="text-tech-text-body-dark max-w-xl font-sans text-sm">
              Transmettez-nous vos spécifications ou déposez votre pièce à l’atelier pour une étude
              de faisabilité immédiate et un devis sous 24h.
            </p>
          </div>

          <Link
            href="/demande"
            className="bg-tech-primary hover:bg-tech-accent hover:shadow-tech-glow inline-flex shrink-0 items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Envoyer mes Spécifications</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
