import { getRequests } from '@/lib/data/requests';
import { mapRequestToUi } from '@/lib/utils/request-mappers';
import AdminSyncClient from './sync-client';

export const dynamic = 'force-dynamic';

export default async function AdminSyncPage() {
  const requests = await getRequests();
  const mappedRequests = requests.map(mapRequestToUi);

  return <AdminSyncClient requests={mappedRequests} />;
}
