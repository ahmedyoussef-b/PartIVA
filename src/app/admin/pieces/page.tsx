import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getParts } from '@/lib/data/parts';
import PiecesClient from './pieces-client';
import type { UserRole } from '@/generated/prisma/client';

export default async function AdminPiecesPage() {
  const parts = await getParts();

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const actorRole = ((session?.user as { role?: string } | undefined)?.role ??
    'VIEWER') as UserRole;

  return <PiecesClient initialParts={parts} actorRole={actorRole} />;
}
