import { getMaterials } from '@/lib/data/materials';
import AdminMateriauxPageClient from './materiaux-client';

export default async function AdminMateriauxPage() {
  const materials = await getMaterials();

  return <AdminMateriauxPageClient initialMaterials={materials} />;
}
