import Link from 'next/link';
import { ArrowLeft, FileText, Image as ImageIcon, Paperclip } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const URGENCY_LABELS: Record<string, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  URGENT: 'Urgente',
};

const CATEGORY_LABELS: Record<string, string> = {
  usage: 'Usage',
  function: 'Fonction',
  processing: 'Traitement',
  mechanical: 'Mécanique',
  manufacturing: 'Fabrication',
  quality: 'Qualité',
};

function formatSize(bytes: number | null | undefined) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(date: Date | undefined | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-xs font-semibold text-gray-500">{label}</dt>
      <dd className="text-sm whitespace-pre-wrap text-gray-800">{value?.trim() || '—'}</dd>
    </div>
  );
}

export default async function CahierDesChargesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    include: { requirements: true },
  });

  if (!project) {
    return <div className="p-6 text-red-600">Projet introuvable : {projectId}</div>;
  }

  const request = project.requestId
    ? await prisma.request.findUnique({
        where: { id: project.requestId },
        include: { cadFiles: true, client: true },
      })
    : null;

  const photos = Array.isArray(request?.photos) ? (request?.photos as unknown as string[]) : [];

  const requirementsByCategory = project.requirements.reduce(
    (acc, requirement) => {
      const key = requirement.category || 'autre';
      acc[key] = acc[key] ?? [];
      acc[key].push(requirement);
      return acc;
    },
    {} as Record<string, typeof project.requirements>,
  );

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gray-50">
      <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/pcb/${projectId}`}
            className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;atelier
          </Link>
          <div>
            <h1 className="text-lg leading-tight font-bold text-gray-900">Cahier des charges</h1>
            <p className="text-xs text-gray-500">
              {project.name} · ID: {projectId}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!request && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Aucune demande client n&apos;est rattachée à ce projet. Le cahier des charges est vide.
          </div>
        )}

        {request && (
          <section className="overflow-hidden rounded-lg border bg-white">
            <div className="flex items-center gap-2 border-b bg-gray-50 p-3 text-sm font-semibold text-gray-700">
              <FileText className="h-4 w-4" />
              Demande client
            </div>
            <dl className="divide-y divide-gray-100 px-4 py-2">
              <Row label="Description du projet" value={request.partDescription} />
              <Row label="Fonction principale" value={request.partFunction} />
              <Row label="Matériau / support" value={request.suspectedMaterial} />
              <Row label="Quantité" value={String(request.quantity)} />
              <Row label="Urgence" value={URGENCY_LABELS[request.urgency] ?? request.urgency} />
              <Row label="Statut de la demande" value={request.status} />
              <Row
                label="Client"
                value={request.client ? (request.client.name ?? request.client.email) : '—'}
              />
              <Row label="Reçue le" value={formatDate(request.createdAt)} />
            </dl>
          </section>
        )}

        {request && (
          <section className="overflow-hidden rounded-lg border bg-white">
            <div className="flex items-center gap-2 border-b bg-gray-50 p-3 text-sm font-semibold text-gray-700">
              <Paperclip className="h-4 w-4" />
              Fichiers transmis
            </div>
            <div className="p-4">
              {photos.length === 0 && request.cadFiles.length === 0 && (
                <p className="text-sm text-gray-500">Aucun fichier transmis.</p>
              )}

              {request.cadFiles.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {request.cadFiles.map((file) => (
                    <li key={file.id} className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {file.name}
                      </a>
                      <span className="text-xs text-gray-500">
                        {file.fileType} · {formatSize(file.sizeBytes)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {photos.map((url, index) => (
                    <a
                      key={`${url}-${index}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative block aspect-square overflow-hidden rounded border bg-gray-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Photo ${index + 1} du cahier des charges`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <span className="absolute right-1 bottom-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                        <ImageIcon className="mr-1 inline h-3 w-3" />
                        {index + 1}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-lg border bg-white">
          <div className="border-b bg-gray-50 p-3 text-sm font-semibold text-gray-700">
            Compilation technique
          </div>
          <div className="p-4">
            {project.requirements.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aucun champ technique renseigné pour l&apos;instant.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(requirementsByCategory).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                      {CATEGORY_LABELS[category] ?? category}
                    </h3>
                    <dl className="divide-y divide-gray-100">
                      {items.map((requirement) => (
                        <div
                          key={requirement.id}
                          className="flex flex-col gap-0.5 py-1.5 sm:flex-row"
                        >
                          <dt className="w-56 shrink-0 text-xs font-semibold text-gray-600">
                            {requirement.key}
                          </dt>
                          <dd className="flex-1 text-sm whitespace-pre-wrap text-gray-800">
                            {requirement.value}
                          </dd>
                          <span className="text-[10px] text-gray-400">{requirement.status}</span>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
