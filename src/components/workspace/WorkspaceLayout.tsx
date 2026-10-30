'use client';

import { ReactNode } from 'react';

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Workspace d&apos;Ingénierie Assistée</h1>
        <p className="text-sm text-gray-500">
          Déposez vos fichiers, décrivez votre pièce, et laissez l&apos;IA vous proposer des
          candidats 3D.
        </p>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}
