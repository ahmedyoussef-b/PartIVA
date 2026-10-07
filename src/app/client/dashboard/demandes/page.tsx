import { getCurrentUser } from '@/lib/auth-server';
import { getRequests } from '@/lib/data/requests';
import DemandesClient from './demandes-client';
import { redirect } from 'next/navigation';

export default async function ClientDemandesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const requests = await getRequests({ clientId: user.id });

  return <DemandesClient initialRequests={requests} />;
}
