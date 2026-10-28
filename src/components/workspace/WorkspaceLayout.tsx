'use client';

import { ReactNode } from 'react';

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Workspace d&apos;Ingénierie Assistée</h1>
        <p className="text-sm text-gray-500">
          Déposez vos fichiers, décrivez votre pièce, et laissez l&apos;IA vous proposer des
          candidats 3D.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">{children}</div>
    </div>
  );
}
