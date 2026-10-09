import { getCurrentUser } from '@/lib/auth-server';
import { getParts } from '@/lib/data/parts';
import { redirect } from 'next/navigation';
import PiecesPretesClient from './pieces-pretes-client';
import type { UserRole } from '@/generated/prisma/client';

export default async function PiecesPretesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const parts = await getParts({ status: 'SUBMITTED', clientId: user.id });

  return <PiecesPretesClient initialParts={parts} actorRole={user.role as UserRole} />;
}
