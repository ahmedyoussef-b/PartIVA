'use client';

import * as React from 'react';
import Link from 'next/link';
import { Cog, MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-card text-card-foreground border-t">
      <div className="container py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand info */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-lg shadow-sm">
                <Cog className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight">PartIVA Atelier</span>
                <span className="text-muted-foreground block font-mono text-[11px] uppercase">
                  Plastiques Techniques & Usinage Numérique
                </span>
              </div>
            </div>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              Atelier spécialisé dans la rétro-ingénierie et l’usinage numérique (CNC) de pièces de
              rechange industrielles en thermoplastiques techniques (POM-C, PTFE, PE1000, PA6,
              PEEK). Éliminez les arrêts de ligne et délais d’importation coûteux.
            </p>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>
                Tolérances d’usinage ISO 2768-mK • Certificats de conformité matière FDA / CE
              </span>
            </div>
          </div>

          {/* Navigation Client Web */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Navigation Web Public</h4>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact & Atelier
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Espace Client Permanent
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  Inscription Client Permanent
                </Link>
              </li>
            </ul>
          </div>

          {/* Atelier Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Atelier & Logistique</h4>
            <div className="text-muted-foreground space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                <span>Zone Industrielle, Sousse & Sfax, Tunisie</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="text-primary h-4 w-4 shrink-0" />
                <span>+216 27 80 37 61</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="text-primary h-4 w-4 shrink-0" />
                <span>contact@partiva.tn</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-primary h-4 w-4 shrink-0" />
                <span>Lun - Sam : 07h30 - 18h00 (Urgences 24/7)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-border/40 text-muted-foreground mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs sm:flex-row">
          <p>
            © {new Date().getFullYear()} PartIVA Atelier. Mode Web Public. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Mentions Légales
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Politique de Confidentialité
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Conditions Générales de Vente
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
