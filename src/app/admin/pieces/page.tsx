import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getParts } from '@/lib/data/parts';
import { prisma } from '@/lib/prisma';
import PiecesClient from './pieces-client';
import type { UserRole } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

export default async function AdminPiecesPage() {
  const [parts, pcbProjects] = await Promise.all([
    getParts(),
    prisma.pcbProject.findMany({
      where: { kicadFilePath: { not: null } },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, kicadFilePath: true, status: true, updatedAt: true },
    }),
  ]);

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const actorRole = ((session?.user as { role?: string } | undefined)?.role ??
    'VIEWER') as UserRole;

  return <PiecesClient initialParts={parts} pcbProjects={pcbProjects} actorRole={actorRole} />;
}
