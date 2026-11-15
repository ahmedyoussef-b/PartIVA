'use client';

import { ReactNode, createContext, useContext, useState } from 'react';

interface WorkspaceContextValue {
  collecteVisible: boolean;
  setCollecteVisible: (v: boolean) => void;
  assistantVisible: boolean;
  setAssistantVisible: (v: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspaceContext must be used within WorkspaceLayout');
  return ctx;
}

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  const [collecteVisible, setCollecteVisible] = useState(true);
  const [assistantVisible, setAssistantVisible] = useState(true);

  const panels = Array.isArray(children) ? children : [children];
  const [collecte, viewport, assistant] = panels;

  const viewportWidth =
    collecteVisible && assistantVisible
      ? 'w-2/4'
      : collecteVisible || assistantVisible
        ? 'w-3/4'
        : 'flex-1';

  return (
    <WorkspaceContext.Provider
      value={{ collecteVisible, setCollecteVisible, assistantVisible, setAssistantVisible }}
    >
      <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
        <header className="border-b bg-white px-6 py-4 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Workspace d&apos;Ingénierie Assistée</h1>
          <p className="text-sm text-gray-500">
            Déposez vos fichiers, décrivez votre pièce, et laissez l&apos;IA vous proposer des
            candidats 3D.
          </p>
        </header>
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
          {collecteVisible && <div className="min-h-0 w-1/4 overflow-auto">{collecte}</div>}
          <div className={`flex min-h-0 flex-col overflow-hidden ${viewportWidth}`}>{viewport}</div>
          {assistantVisible && <div className="min-h-0 w-1/4 overflow-auto">{assistant}</div>}
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
