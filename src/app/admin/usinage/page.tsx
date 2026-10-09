import { getRequests } from '@/lib/data/requests';
import { getMachines as getMachinesData } from '@/lib/data/machines';
import { mapRequestToUi } from '@/lib/utils/request-mappers';
import AdminUsinageClient from './usinage-client';

export default async function AdminUsinagePage() {
  const [requests, machines] = await Promise.all([getRequests(), getMachinesData()]);

  const mappedRequests = requests.map(mapRequestToUi);

  return <AdminUsinageClient requests={mappedRequests} machines={machines} />;
}
