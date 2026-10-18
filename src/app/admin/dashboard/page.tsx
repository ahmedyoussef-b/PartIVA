'use client';

import * as React from 'react';
import { getDashboard } from '@/lib/data-client';
import { mapRequestToUi } from '@/lib/utils/request-mappers';
import AdminDashboardClient from './dashboard-client';
import type { MappedRequest } from '@/lib/utils/request-mappers';
import type { MachineWithRelations } from '@/lib/data/machines';
import AuthGuard from '@/lib/auth-guard';

function AdminDashboardPageContent() {
  const [requests, setRequests] = React.useState<MappedRequest[]>([]);
  const [machines, setMachines] = React.useState<MachineWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const dashboardData = await getDashboard();
        const { requests: reqs, machines: machs } = dashboardData;
        const mappedRequests = reqs?.map(mapRequestToUi) || [];
        setRequests(mappedRequests);
        setMachines(machs || []);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
        setRequests([]);
        setMachines([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground text-sm">Chargement...</div>
      </div>
    );
  }

  return <AdminDashboardClient requests={requests} machines={machines} />;
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard>
      <AdminDashboardPageContent />
    </AuthGuard>
  );
}
