'use client';

import Link from 'next/link';
import { Cpu, FileText, ArrowRight } from 'lucide-react';

export default function PcbStudioPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">PCB Design Studio</h1>
        <p className="text-sm text-gray-500">
          Choisissez votre point de départ pour la conception de la carte.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link
          href="/admin/pcb/nouveau"
          className="group rounded border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          onClick={() =>
            console.info('[PCB:STUDIO] Choix du mode de conception', { mode: 'from_scratch' })
          }
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Cpu className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">Concevoir une nouvelle carte</h2>
          <p className="mt-1 text-sm text-gray-500">
            Partir de zéro : définir les exigences et concevoir la carte étape par étape.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
            Créer un projet vierge
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        <Link
          href="/admin/pcb/projets"
          className="group rounded border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          onClick={() =>
            console.info('[PCB:STUDIO] Choix du mode de conception', { mode: 'from_client' })
          }
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <FileText className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">
            Concevoir à partir d&apos;un cahier des charges client
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Reprendre une demande client non consultée et concevoir la carte selon ses
            spécifications.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
            Voir les demandes clients
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      <div className="mt-8">
        <Link href="/admin/pcb/bibliotheque" className="text-sm text-blue-600 hover:underline">
          Consulter la bibliothèque de composants →
        </Link>
      </div>
    </main>
  );
}