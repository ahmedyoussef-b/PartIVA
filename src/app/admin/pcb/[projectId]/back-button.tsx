'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function WorkspaceBackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        console.info('[PCB:WORKSPACE] Retour vers le Studio');
        router.push('/admin/pcb/projets');
      }}
      className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
    >
      <ArrowLeft className="h-4 w-4" />
      Retour
    </button>
  );
}
