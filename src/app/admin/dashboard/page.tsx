import { getRequests } from '@/lib/data/requests';
import { getMachines as getMachinesData } from '@/lib/data/machines';
import { mapRequestToUi } from '@/lib/utils/request-mappers';
import AdminDashboardClient from './dashboard-client';

export default async function AdminDashboardPage() {
  const [requests, machines] = await Promise.all([getRequests(), getMachinesData()]);

  const mappedRequests = requests.map(mapRequestToUi);

  return <AdminDashboardClient requests={mappedRequests} machines={machines} />;
}
