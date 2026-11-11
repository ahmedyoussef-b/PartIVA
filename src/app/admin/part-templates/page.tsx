import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { listPartTemplates } from '@/lib/actions/part-templates';
import PartTemplatesClient from './part-templates-client';
import type { UserRole, PartTemplate } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

export default async function AdminPartTemplatesPage() {
  let templates: PartTemplate[] = [];
  try {
    templates = await listPartTemplates();
  } catch {
    templates = [];
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const actorRole = ((session?.user as { role?: string } | undefined)?.role ??
    'VIEWER') as UserRole;

  return <PartTemplatesClient initialTemplates={templates} actorRole={actorRole} />;
}
