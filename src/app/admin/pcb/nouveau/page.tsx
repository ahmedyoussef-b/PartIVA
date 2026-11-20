'use client';

import { useEffect } from 'react';
import { RequirementForm } from '@/components/pcb/RequirementForm';

export default function NouveauPcbPage() {
  useEffect(() => {
    console.info("[PCB:NOUVEAU] Création d'un projet vierge");
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <RequirementForm />
    </main>
  );
}