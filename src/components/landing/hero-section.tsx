'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

interface HeroSectionProps {
  badgeText?: string;
  titlePrefix?: string;
  titleHighlight?: string;
  titleSuffix?: string;
  subtitle?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
}

export function HeroSection({
  badgeText = 'Atelier Spécialisé • Plastiques Techniques & Rétro-Ingénierie',
  titlePrefix = 'Usinage CNC &',
  titleHighlight = 'Pièces de Rechange',
  titleSuffix = 'Haute Précision',
  subtitle = 'Fabrication sur mesure et reproduction à l’identique de pièces industrielles critiques (POM-C, PTFE, PEEK, UHMW-PE, PA6). Évitez les arrêts de production imprévus.',
  primaryCtaText = 'Demander un Devis Express',
  primaryCtaHref = '/demande',
  secondaryCtaText = 'Explorer le Catalogue',
  secondaryCtaHref = '/services',
}: HeroSectionProps) {
  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-tech-navy py-16 text-white lg:py-24">
      {/* Background High-Tech Mesh & Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Radial top-right electric blue glow */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-tech-accent/20 blur-[100px] lg:h-[32rem] lg:w-[32rem]" />
        {/* Radial bottom-left dark navy/primary glow */}
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-tech-primary/25 blur-[120px] lg:h-[36rem] lg:w-[36rem]" />
        {/* Center subtle gradient beam */}
        <div className="absolute top-1/4 left-1/2 h-64 w-[48rem] -translate-x-1/2 bg-gradient-to-r from-tech-primary/10 via-tech-accent/15 to-transparent blur-3xl" />

        {/* Isometric Digital Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] bg-[size:4rem_4rem] opacity-[0.07]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Headline, Description & CTAs */}
          <div className="space-y-8 text-center lg:col-span-7 lg:text-left">
            {/* Top High-Tech Pill Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-tech-primary-light shadow-inner backdrop-blur-md">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-tech-accent" />
              <span>{badgeText}</span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </div>

            {/* Main H1 Title with Gradient */}
            <h1 className="font-heading text-4xl leading-[1.12] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="block text-white sm:inline">{titlePrefix} </span>
              <span className="bg-gradient-to-r from-tech-primary via-tech-accent to-tech-primary-light bg-clip-text text-transparent">
                {titleHighlight}
              </span>{' '}
              <span className="block text-white sm:inline">{titleSuffix}</span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-2xl font-sans text-base leading-relaxed font-normal text-tech-text-body-dark sm:text-lg lg:mx-0 lg:text-xl">
              {subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row lg:justify-start">
              {/* Primary Pill Button with Glow effect */}
              <Link
                href={primaryCtaHref}
                className="group inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-tech-primary px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-tech-accent hover:shadow-tech-glow active:translate-y-0 sm:w-auto"
              >
                <span>{primaryCtaText}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              {/* Secondary Contour Button */}
              <Link
                href={secondaryCtaHref}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-tech-border-dark bg-white/5 px-7 py-4 text-base font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-tech-primary hover:bg-white/10 sm:w-auto"
              >
                <span>{secondaryCtaText}</span>
              </Link>
            </div>

            {/* Metric Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-center lg:text-left">
              <div className="space-y-1">
                <div className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  24-48h
                </div>
                <div className="flex items-center justify-center gap-1.5 font-sans text-xs text-tech-text-body-dark sm:text-sm lg:justify-start">
                  <Clock className="hidden h-3.5 w-3.5 shrink-0 text-tech-accent sm:inline" />
                  <span>Délai critique express</span>
                </div>
              </div>

              <div className="space-y-1 border-x border-white/10 px-2 sm:px-4">
                <div className="font-heading text-2xl font-bold tracking-tight text-tech-primary-light sm:text-3xl">
                  ±0.02 mm
                </div>
                <div className="flex items-center justify-center gap-1.5 font-sans text-xs text-tech-text-body-dark sm:text-sm lg:justify-start">
                  <Cpu className="hidden h-3.5 w-3.5 shrink-0 text-tech-accent sm:inline" />
                  <span>Tolérance CNC</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-heading text-2xl font-bold tracking-tight text-emerald-400 sm:text-3xl">
                  100%
                </div>
                <div className="flex items-center justify-center gap-1.5 font-sans text-xs text-tech-text-body-dark sm:text-sm lg:justify-start">
                  <ShieldCheck className="hidden h-3.5 w-3.5 shrink-0 text-emerald-400 sm:inline" />
                  <span>Matières certifiées</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-Tech Isometric 3D Showcase */}
          <div className="relative flex w-full items-center justify-center lg:col-span-5">
            {/* Ambient Backlight Frame */}
            <div className="relative flex aspect-square w-full max-w-md items-center justify-center sm:max-w-lg">
              {/* Spinning / Glowing Outer Rings */}
              <div className="absolute inset-4 scale-95 rotate-1 rounded-3xl border border-tech-primary/30 bg-gradient-to-tr from-tech-primary/10 via-transparent to-tech-accent/20 backdrop-blur-xl transition-transform duration-700 hover:rotate-0" />
              <div className="absolute inset-0 rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-2xl" />

              {/* Central Isometric 3D CAD Component Blueprint */}
              <div className="relative z-10 flex h-full w-full flex-col justify-between p-6 sm:p-8">
                {/* Header of Showcase Card */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl border border-tech-primary/40 bg-tech-primary/20 p-2 text-tech-primary-light">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block font-mono text-xs font-semibold tracking-wider text-tech-accent uppercase">
                        CAO / Modélisation 3D
                      </span>
                      <span className="text-sm font-semibold text-white">
                        Pignon Conique Hélicoïdal
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Validé CNC
                  </span>
                </div>

                {/* Isometric Graphic Representation */}
                <div className="relative my-6 flex items-center justify-center py-6">
                  {/* Decorative Axis Lines */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-tech-primary-light to-transparent" />
                    <div className="absolute h-full w-px bg-gradient-to-b from-transparent via-tech-primary-light to-transparent" />
                  </div>

                  {/* SVG Isometric Gear & Mechanical Core */}
                  <div className="group relative">
                    <div className="absolute -inset-4 rounded-full bg-tech-primary/20 opacity-75 blur-xl transition-opacity group-hover:opacity-100" />
                    <svg
                      viewBox="0 0 200 200"
                      className="h-44 w-44 drop-shadow-[0_10px_25px_rgba(30,136,229,0.35)] transition-transform duration-500 hover:scale-105 sm:h-52 sm:w-52"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Outer Isometric Rim */}
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        stroke="#1e88e5"
                        strokeWidth="3"
                        strokeDasharray="6 4"
                        className="animate-[spin_40s_linear_infinite]"
                      />
                      {/* Inner Gear Teeth Contour */}
                      <path
                        d="M100 35 L108 47 L122 43 L126 57 L140 57 L140 71 L154 75 L150 89 L162 97 L154 109 L162 121 L148 127 L152 141 L138 143 L138 157 L124 155 L120 169 L106 163 L100 175 L94 163 L80 169 L76 155 L62 157 L62 143 L48 141 L52 127 L38 121 L46 109 L38 97 L50 89 L46 75 L60 71 L60 57 L74 57 L78 43 L92 47 Z"
                        fill="url(#coreGradient)"
                        stroke="#64b5f6"
                        strokeWidth="2"
                        className="transition-all duration-300 hover:brightness-110"
                      />
                      {/* Inner Hollow Chamber */}
                      <circle
                        cx="100"
                        cy="100"
                        r="34"
                        fill="#072066"
                        stroke="#2196f3"
                        strokeWidth="3"
                      />
                      {/* Center Shaft Keyway */}
                      <rect
                        x="93"
                        y="82"
                        width="14"
                        height="36"
                        rx="2"
                        fill="#1e88e5"
                        opacity="0.8"
                      />
                      <circle cx="100" cy="100" r="12" fill="#ffffff" />
                      <circle cx="100" cy="100" r="6" fill="#072066" />

                      {/* Gradients */}
                      <defs>
                        <linearGradient
                          id="coreGradient"
                          x1="38"
                          y1="35"
                          x2="162"
                          y2="175"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#1e88e5" />
                          <stop offset="0.5" stopColor="#072066" />
                          <stop offset="1" stopColor="#0d47a1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                {/* Floating Micro-specs Footer */}
                <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-3 font-mono text-xs">
                  <div className="space-y-1 rounded-xl border border-white/5 bg-white/[0.04] p-2.5">
                    <span className="block text-[10px] text-tech-text-body-dark uppercase">
                      Matière Technique
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-white">
                      <Sparkles className="h-3.5 w-3.5 text-tech-accent" />
                      POM-C Polyacétal
                    </span>
                  </div>

                  <div className="space-y-1 rounded-xl border border-white/5 bg-white/[0.04] p-2.5">
                    <span className="block text-[10px] text-tech-text-body-dark uppercase">
                      Norme & Usinage
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-white">
                      <Cpu className="h-3.5 w-3.5 text-tech-primary-light" />5 Axes ISO 2768-m
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Badge (Top Right) */}
              <div className="absolute -top-4 -right-4 hidden items-center gap-2 rounded-2xl border border-tech-accent/40 bg-tech-navy/90 px-3.5 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-md sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Précision ±0.02mm</span>
              </div>

              {/* Floating Badge (Bottom Left) */}
              <div className="absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-2xl border border-tech-primary/40 bg-tech-navy/90 px-3.5 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-md sm:flex">
                <Clock className="h-3.5 w-3.5 text-tech-primary-light" />
                <span>Expédition 24/48h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
