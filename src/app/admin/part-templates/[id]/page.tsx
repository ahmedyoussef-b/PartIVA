import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EditTemplateForm } from './edit-form';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/part-templates"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:underline"
        >
          Liste des templates
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Éditer le template</h1>
        <span className="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground">
          {actorRole}
        </span>
      </div>
      <EditTemplateForm initialTemplate={template} />
    </div>
  );
}
