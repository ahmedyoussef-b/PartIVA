import { getRequests } from '@/lib/data/requests';
import DemandesClient from './demandes-client';

export default async function AdminDemandesPage() {
  const requests = await getRequests();

  return <DemandesClient initialRequests={requests} />;
}
