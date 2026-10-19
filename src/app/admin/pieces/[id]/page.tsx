import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getPartById } from '@/lib/data/parts';
import { StlViewer } from '@/components/3d/stl-viewer';
import type { UserRole } from '@/generated/prisma/client';

export default async function AdminPieceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const actorRole = ((session?.user as { role?: string } | undefined)?.role ??
    'VIEWER') as UserRole;

  const part = await getPartById(id);

  if (!part) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Pièce introuvable</h1>
          <p className="mt-2 text-muted-foreground">
            Aucune pièce ne correspond à l’identifiant <code>{id}</code>.
          </p>
        </div>
      </div>
    );
  }

  const hasModel = Boolean(part.printableModelUrl);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pièce — {part.ptvReference}</h1>
          <p className="text-muted-foreground text-sm">{part.name}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground">
            {actorRole}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualiseur 3D */}
        <div className="lg:col-span-1">
          {hasModel ? (
            <StlViewer src={part.printableModelUrl!} alt="Modèle 3D de la pièce" height="500px" />
          ) : (
            <div className="aspect-video bg-slate-900 rounded-lg border border-slate-700 flex flex-col items-center justify-center py-12 text-muted-foreground">
              Aucun modèle 3D disponible
            </div>
          )}
        </div>

        {/* Détails */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Détails</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Référence PTV</dt>
                <dd className="font-mono text-sm">{part.ptvReference}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">N° pièce (legacy)</dt>
                <dd className="font-mono text-sm">{part.partNumber}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Statut</dt>
                <dd className="text-sm">{part.status}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Matière</dt>
                <dd className="text-sm">{part.material ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Description</dt>
                <dd className="text-sm">{part.description ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">
                  Modèle 3D imprimable
                </dt>
                <dd className="flex items-center gap-2 text-sm">
                  {hasModel ? (
                    <>
                      <span className="text-green-600 font-mono">{part.printableModelUrl}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Aucun modèle 3D associé</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}