import Link from 'next/link';
import { KiCadStatus } from '@/components/pcb/KiCadStatus';

export default function PcbStudioPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">PCB Design Studio</h1>
        <p className="text-sm text-gray-500">Conception électronique assistée par IA et KiCad</p>
      </header>

      <div className="mb-6">
        <KiCadStatus />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/admin/pcb/nouveau"
          className="rounded border bg-white p-4 shadow-sm hover:shadow-md"
        >
          <h2 className="text-lg font-semibold">Nouveau projet</h2>
          <p className="mt-1 text-sm text-gray-500">Créer un cahier des charges (7 blocs)</p>
        </Link>

        <Link
          href="/admin/pcb/bibliotheque"
          className="rounded border bg-white p-4 shadow-sm hover:shadow-md"
        >
          <h2 className="text-lg font-semibold">Bibliothèque</h2>
          <p className="mt-1 text-sm text-gray-500">Catalogue composants + prix</p>
        </Link>

        <div className="rounded border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Projets existants</h2>
          <p className="mt-1 text-sm text-gray-500">
            Accédez à vos projets via l&apos;URL /admin/pcb/[projectId]
          </p>
        </div>
      </div>
    </main>
  );
}
