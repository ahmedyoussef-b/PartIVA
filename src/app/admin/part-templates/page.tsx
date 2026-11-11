import { headers } from 'next/headers';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { listPartTemplates } from '@/lib/actions/part-templates';
import PartTemplatesClient from './part-templates-client';
import { Button } from '@/components/ui/button';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/part-templates/new">Créer un template</Link>
        </Button>
      </div>
      <PartTemplatesClient initialTemplates={templates} actorRole={actorRole} />
    </div>
  );
}
