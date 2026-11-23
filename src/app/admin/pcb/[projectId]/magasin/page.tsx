'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CatalogAuditTable from '@/components/pcb/CatalogAuditTable';

export default function MagasinAuditPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId ?? '';

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">
          Audit complet du magasin de composants
        </h1>
        <Link href={`/admin/pcb/${projectId}`}>
          <Button variant="outline" size="sm">
            Retour au projet
          </Button>
        </Link>
      </div>
      <CatalogAuditTable />
    </div>
  );
}
