import { prisma } from '@/lib/prisma';
import { getRequests } from '@/lib/data/requests';
import DemandesClient from './demandes-client';

export default async function ClientDemandesPage() {
  const clientEmail = 'user@partiva.dev';
  const users = await prisma.user.findMany({
    where: { email: clientEmail },
    select: { id: true },
  });
  const clientId = users[0]?.id;
  const requests = clientId ? await getRequests({ clientId }) : [];

  return <DemandesClient initialRequests={requests} />;
}
