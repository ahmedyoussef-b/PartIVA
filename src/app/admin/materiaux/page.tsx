'use client';

import * as React from 'react';
import { getMaterials } from '@/lib/data-client';
import AdminMateriauxPageClient from './materiaux-client';
import type { Material } from '@/generated/prisma/client';

export default function AdminMateriauxPage() {
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchMaterials() {
      try {
        const mats = await getMaterials();
        setMaterials(mats || []);
      } catch (error) {
        console.error('Failed to fetch materials:', error);
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMaterials();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground text-sm">Chargement...</div>
      </div>
    );
  }

  return <AdminMateriauxPageClient initialMaterials={materials} />;
}
