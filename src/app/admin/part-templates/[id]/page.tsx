import { headers } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EditTemplateButton } from '@/app/admin/part-templates/[id]/edit-template-button';
import { DeleteTemplateButton } from '@/app/admin/part-templates/[id]/delete-template-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPartTemplateDetailPage({
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

  const template = await prisma.partTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Template introuvable</h1>
          <p className="mt-2 text-muted-foreground">
            Aucun template ne correspond à l’identifiant <code>{id}</code>.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/admin/part-templates">Retour à la liste</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/admin/part-templates"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            Liste des templates
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {template.categoryId ? (
              <span className="font-mono text-sm">{template.categoryId}</span>
            ) : null}
            {template.material ? <Badge variant="outline">{template.material}</Badge> : null}
            {template.sourceMethod ? (
              <span className="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                {template.sourceMethod}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground">
            {actorRole}
          </span>
          <EditTemplateButton template={template} />
          <DeleteTemplateButton templateId={template.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border bg-border p-4">
            <h2 className="mb-2 text-sm font-medium">Détails</h2>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">ID</dt>
                <dd className="font-mono">{template.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Nom</dt>
                <dd>{template.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Description</dt>
                <dd>{template.description ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Matière</dt>
                <dd>{template.material ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Méthode source</dt>
                <dd>{template.sourceMethod ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Créé le</dt>
                <dd>{template.createdAt.toLocaleDateString('fr-FR')}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Mis à jour le</dt>
                <dd>{template.updatedAt.toLocaleDateString('fr-FR')}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
