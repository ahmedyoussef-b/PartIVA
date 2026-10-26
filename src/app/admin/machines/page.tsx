import { getMachines } from '@/lib/data/machines';
import MachinesClient from './machines-client';

export const dynamic = 'force-dynamic';

export default async function AdminMachinesPage() {
  const machines = await getMachines();

  return <MachinesClient initialMachines={machines} />;
}


