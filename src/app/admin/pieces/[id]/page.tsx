import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getPartById } from '@/lib/data/parts';
import { ModelViewer } from '@/components/3d/model-viewer';
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
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-destructive text-2xl font-bold">Pièce introuvable</h1>
          <p className="text-muted-foreground mt-2">
            Aucune pièce ne correspond à l’identifiant <code>{id}</code>.
          </p>
        </div>
      </div>
    );
  }

  const hasModel = Boolean(part.printableModelUrl);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pièce — {part.ptvReference}</h1>
          <p className="text-muted-foreground text-sm">{part.name}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-secondary text-secondary-foreground rounded px-2 py-1">
            {actorRole}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Visualiseur 3D */}
        <div className="lg:col-span-1">
          {hasModel ? (
            <ModelViewer src={part.printableModelUrl!} alt="Modèle 3D de la pièce" height="500px" />
          ) : (
            <div className="text-muted-foreground flex aspect-video flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-900 py-12">
              Aucun modèle 3D disponible
            </div>
          )}
        </div>

        {/* Détails */}
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Détails</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-xs font-medium">Référence PTV</dt>
                <dd className="font-mono text-sm">{part.ptvReference}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-medium">N° pièce (legacy)</dt>
                <dd className="font-mono text-sm">{part.partNumber}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-medium">Statut</dt>
                <dd className="text-sm">{part.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-medium">Matière</dt>
                <dd className="text-sm">{part.material ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-xs font-medium">Description</dt>
                <dd className="text-sm">{part.description ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-xs font-medium">Modèle 3D imprimable</dt>
                <dd className="flex items-center gap-2 text-sm">
                  {hasModel ? (
                    <>
                      <span className="font-mono text-green-600">{part.printableModelUrl}</span>
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
