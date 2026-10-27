'use client';

import Link from 'next/link';
import { HeroSection } from '@/components/landing/hero-section';
import { ServiceCardsGrid } from '@/components/landing/service-cards-grid';
import {
  Clock,
  Compass,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  Utensils,
  Shirt,
  Package,
  Factory,
  Pill,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col bg-tech-surface-subtle">
      {/* 1. HERO SECTION TEMPLATEMONSTER #535437 */}
      <HeroSection />

      {/* 2. SERVICE CARDS GRID */}
      <ServiceCardsGrid />

      {/* 3. POURQUOI CHOISIR PARTIVA ATELIER */}
      <section className="relative border-t border-tech-border bg-white py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-tech-primary/20 bg-tech-primary/10 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-tech-primary uppercase">
              <span>Performance & Réactivité Industrielle</span>
            </div>

            <h2 className="font-heading text-3xl font-bold tracking-tight text-tech-navy sm:text-4xl lg:text-5xl">
              Pourquoi Confier vos Pièces Critiques à{' '}
              <span className="bg-gradient-to-r from-tech-primary via-tech-accent to-tech-navy bg-clip-text text-transparent">
                PartIVA ?
              </span>
            </h2>

            <p className="mx-auto max-w-2xl font-sans text-base leading-relaxed text-tech-text-body sm:text-lg">
              Trois engagements concrets pour sécuriser vos chaînes de production et éliminer
              définitivement les arrêts imprévus.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Pilier 1 */}
            <div className="group flex flex-col justify-between rounded-tech-card border border-tech-border bg-tech-surface-subtle/50 p-8 transition-all duration-300 hover:border-tech-primary hover:bg-white hover:shadow-tech-hover">
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tech-primary/10 text-tech-primary transition-colors duration-300 group-hover:bg-tech-primary group-hover:text-white">
                  <Clock className="h-7 w-7" />
                </div>
                <h3 className="font-heading text-xl font-bold text-tech-navy transition-colors group-hover:text-tech-primary">
                  Zéro Dépendance Import
                </h3>
                <p className="font-sans text-sm leading-relaxed text-tech-text-body">
                  Fini les délais de 6 à 12 semaines pour importer un pignon ou un guide depuis
                  l’étranger. Nous usinons localement en Tunisie sous 24 à 48 heures pour vos
                  urgences.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 border-t border-tech-border pt-6 font-mono text-xs font-semibold text-tech-primary">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Gain de temps : jusqu’à 95%</span>
              </div>
            </div>

            {/* Pilier 2 */}
            <div className="group flex flex-col justify-between rounded-tech-card border border-tech-border bg-tech-surface-subtle/50 p-8 transition-all duration-300 hover:border-tech-primary hover:bg-white hover:shadow-tech-hover">
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tech-primary/10 text-tech-primary transition-colors duration-300 group-hover:bg-tech-primary group-hover:text-white">
                  <Compass className="h-7 w-7" />
                </div>
                <h3 className="font-heading text-xl font-bold text-tech-navy transition-colors group-hover:text-tech-primary">
                  Rétro-Ingénierie Sans Plan
                </h3>
                <p className="font-sans text-sm leading-relaxed text-tech-text-body">
                  Votre machine est ancienne ou le fabricant n’existe plus ? Fournissez-nous
                  simplement votre pièce usée ou brisée : nous la numérisons et la reproduisons à
                  l’identique.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 border-t border-tech-border pt-6 font-mono text-xs font-semibold text-tech-primary">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Reconstitution CAO 3D exacte</span>
              </div>
            </div>

            {/* Pilier 3 */}
            <div className="group flex flex-col justify-between rounded-tech-card border border-tech-border bg-tech-surface-subtle/50 p-8 transition-all duration-300 hover:border-tech-primary hover:bg-white hover:shadow-tech-hover">
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tech-primary/10 text-tech-primary transition-colors duration-300 group-hover:bg-tech-primary group-hover:text-white">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="font-heading text-xl font-bold text-tech-navy transition-colors group-hover:text-tech-primary">
                  100% Polymères Certifiés
                </h3>
                <p className="font-sans text-sm leading-relaxed text-tech-text-body">
                  POM-C, PTFE pur ou chargé, UHMW-PE 1000, PEEK haute température : nous
                  sélectionnons uniquement des ébauches certifiées CE/FDA adaptées à vos contraintes
                  mécaniques.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 border-t border-tech-border pt-6 font-mono text-xs font-semibold text-tech-primary">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Conformité alimentaire & chimique</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTEURS D'INTERVENTION */}
      <section className="border-t border-tech-border bg-tech-surface-subtle py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
            <span className="font-mono text-xs font-bold tracking-wider text-tech-primary uppercase">
              Industrie & Maintenance
            </span>
            <h2 className="font-heading text-3xl font-bold text-tech-navy sm:text-4xl">
              Partenaire Clé des Sites Industriels en Tunisie
            </h2>
            <p className="font-sans text-sm text-tech-text-body sm:text-base">
              Nous intervenons auprès des responsables de maintenance et directeurs d’usine de
              Bizerte à Sfax.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              {
                name: 'Agroalimentaire & Boissons',
                icon: Utensils,
                desc: 'Normes FDA / Inox & Plastique',
              },
              {
                name: 'Conditionnement & Emballage',
                icon: Package,
                desc: 'Guides, pignons & étoiles',
              },
              {
                name: 'Textile & Confection',
                icon: Shirt,
                desc: 'Poulies légères & bagues téflon',
              },
              { name: 'Pharmacie & Chimie', icon: Pill, desc: 'PTFE, PEEK résistant aux acides' },
              {
                name: 'Mécanique Industrielle',
                icon: Factory,
                desc: 'Pignons, galets & coussinets',
              },
            ].map((sector) => {
              const Icon = sector.icon;
              return (
                <div
                  key={sector.name}
                  className="group flex flex-col items-center gap-3 rounded-tech-card border border-tech-border bg-white p-6 text-center shadow-tech transition-all duration-300 hover:-translate-y-1 hover:border-tech-primary hover:shadow-tech-hover"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tech-primary/10 text-tech-primary transition-colors duration-200 group-hover:bg-tech-primary group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-heading text-sm leading-snug font-bold text-tech-navy">
                    {sector.name}
                  </h4>
                  <p className="font-sans text-[11px] leading-tight text-tech-text-muted">
                    {sector.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. BANNIÈRE D'APPEL À L'ACTION FINALE */}
      <section className="relative overflow-hidden bg-tech-navy py-20 text-white">
        {/* Subtle background ambient lights */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-tech-accent blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-tech-primary blur-3xl" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-8 rounded-tech-card border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-tech-primary-light">
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
              <span>Devis Express en Moins de 2 Heures</span>
            </div>

            <h2 className="font-heading text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Une Pièce Défectueuse ?{' '}
              <span className="bg-gradient-to-r from-tech-primary via-tech-accent to-tech-primary-light bg-clip-text text-transparent">
                Envoyez une Photo ou un Plan
              </span>
            </h2>

            <p className="mx-auto max-w-2xl font-sans text-base leading-relaxed text-tech-text-body-dark sm:text-lg">
              Nos ingénieurs et techniciens analysent la faisabilité, identifient la matière
              adéquate et vous transmettent un devis ferme avec engagement de livraison immédiat.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
              <Link
                href="/demande"
                className="group inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-tech-primary px-9 py-4 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-tech-accent hover:shadow-tech-glow active:translate-y-0 sm:w-auto"
              >
                <span>Demander mon Devis Immédiat</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/contact"
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-tech-primary hover:bg-white/10 sm:w-auto"
              >
                <PhoneCall className="h-4 w-4 text-tech-primary-light" />
                <span>Contacter l’Atelier Direct</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
