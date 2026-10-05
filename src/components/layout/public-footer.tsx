'use client';

import * as React from 'react';
import Link from 'next/link';
import { Cog, MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand info */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Cog className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight">PartIVA Atelier</span>
                <span className="block font-mono text-[11px] uppercase text-muted-foreground">
                  Plastiques Techniques & Usinage Numérique
                </span>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Atelier spécialisé dans la rétro-ingénierie et l’usinage numérique (CNC) de pièces de
              rechange industrielles en thermoplastiques techniques (POM-C, PTFE, PE1000, PA6,
              PEEK). Éliminez les arrêts de ligne et délais d’importation coûteux.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>
                Tolérances d’usinage ISO 2768-mK • Certificats de conformité matière FDA / CE
              </span>
            </div>
          </div>

          {/* Navigation Client Web */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Navigation Web Public</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-foreground">
                  Contact & Atelier
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-foreground">
                  Espace Client Permanent
                </Link>
              </li>
              <li>
                <Link href="/register" className="transition-colors hover:text-foreground">
                  Inscription Client Permanent
                </Link>
              </li>
            </ul>
          </div>

          {/* Atelier Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Atelier & Logistique</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Zone Industrielle, Sousse & Sfax, Tunisie</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>+216 27 80 37 61</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>contact@partiva.tn</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>Lun - Sam : 07h30 - 18h00 (Urgences 24/7)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} PartIVA Atelier. Mode Web Public. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Mentions Légales
            </Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Politique de Confidentialité
            </Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Conditions Générales de Vente
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
