import { getMaterials } from '@/lib/data/materials';
import MateriauxPageClient from './materiaux-client';

export const dynamic = 'force-dynamic';

export default async function MateriauxPage() {
  const materials = await getMaterials();

  return <MateriauxPageClient initialMaterials={materials} />;
}
