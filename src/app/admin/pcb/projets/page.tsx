import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { concevoirDepuisDemande } from './actions';

export const dynamic = 'force-dynamic';

function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('fr-FR');
}

export default async function PcbProjetsPage() {
  console.info('[PCB:PROJETS] Liste des projets reçus chargée');

  const [received, localProjects] = await Promise.all([
    prisma.request.findMany({
      where: { type: 'PCB', status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true, email: true } } },
    }),
    prisma.pcbProject.findMany({
      where: { status: { in: ['draft', 'in_progress'] } },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  console.info('[PCB:PROJETS] Liste des projets locaux chargée');

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projets PCB</h1>
          <p className="text-sm text-gray-500">
            File d&apos;attente des cahiers des charges reçus et projets locaux en cours.
          </p>
        </div>
        <Link href="/admin/pcb" className="text-sm text-blue-600 hover:underline">
          ← Retour au Studio
        </Link>
      </header>

      {/* Section 1 — Projets reçus */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">
          Projets reçus (non consultés){' '}
          <span className="text-sm font-normal text-gray-500">({received.length})</span>
        </h2>
        {received.length === 0 ? (
          <div className="rounded border bg-white p-6 text-center text-sm text-gray-500">
            Aucun cahier des charges PCB reçu.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {received.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs font-bold text-primary">
                      {r.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2">{r.partDescription || '—'}</td>
                    <td className="px-4 py-2">{r.client?.name || r.client?.email || '—'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <form action={concevoirDepuisDemande}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <button
                          type="submit"
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          Concevoir
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 2 — Projets locaux */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Projets locaux (en cours){' '}
          <span className="text-sm font-normal text-gray-500">({localProjects.length})</span>
        </h2>
        {localProjects.length === 0 ? (
          <div className="rounded border bg-white p-6 text-center text-sm text-gray-500">
            Aucun projet local en cours.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Nom du projet</th>
                  <th className="px-4 py-2">Statut</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {localProjects.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs font-bold text-primary">
                      {p.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                      {formatDate(p.updatedAt)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/admin/pcb/${p.id}`} className="text-blue-600 hover:underline">
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
