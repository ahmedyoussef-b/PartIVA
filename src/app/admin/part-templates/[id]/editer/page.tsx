import { headers } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PartTemplateForm } from '@/app/admin/part-templates/[id]/editer/part-template-form';

export const dynamic = 'force-dynamic';

export default async function AdminPartTemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const actorRole = ((session?.user as { role?: string } | undefined)?.role ?? 'VIEWER') as string;

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
          <Link href="/admin/part-templates" className="mt-6 inline-block">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/part-templates/${id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour à la fiche
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Éditer le template</h1>
        <span className="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground">
          {actorRole}
        </span>
      </div>
      <PartTemplateForm initialTemplate={template} />
    </div>
  );
}
