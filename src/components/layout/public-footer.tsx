'use client'

import * as React from 'react'
import Link from 'next/link'
import { Cog, MapPin, Phone, Mail, Clock, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react'

export function PublicFooter() {
  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <Cog className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="font-bold tracking-tight text-base">PartIVA Atelier</span>
                <span className="block text-[11px] font-mono text-muted-foreground uppercase">
                  Plastiques Techniques & Usinage Numérique
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Atelier spécialisé dans la rétro-ingénierie et l’usinage numérique (CNC) de pièces de
              rechange industrielles en thermoplastiques techniques (POM-C, PTFE, PE1000, PA6, PEEK).
              Éliminez les arrêts de ligne et délais d’importation coûteux.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Tolérances d’usinage ISO 2768-mK • Certificats de conformité matière FDA / CE</span>
            </div>
          </div>

          {/* Navigation Client Web */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Navigation Web Public</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
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
            <h4 className="font-semibold text-sm">Atelier & Logistique</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Zone Industrielle, Sousse & Sfax, Tunisie</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>+216 27 80 37 61</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span>contact@partiva.tn</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span>Lun - Sam : 07h30 - 18h00 (Urgences 24/7)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} PartIVA Atelier. Mode Web Public. Tous droits réservés.</p>
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
  )
}
