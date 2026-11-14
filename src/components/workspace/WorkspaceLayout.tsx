'use client';

import * as React from 'react';

interface FullscreenContextValue {
  fullscreen: boolean;
  setFullscreen: (value: boolean) => void;
}

const FullscreenContext = React.createContext<FullscreenContextValue | null>(null);

export function useFullscreen() {
  const ctx = React.useContext(FullscreenContext);
  if (!ctx) {
    throw new Error('useFullscreen must be used within WorkspaceLayout');
  }
  return ctx;
}

interface WorkspaceLayoutProps {
  collecte: React.ReactNode;
  viewport: React.ReactNode;
  assistant: React.ReactNode;
}

export function WorkspaceLayout({ collecte, viewport, assistant }: WorkspaceLayoutProps) {
  const [fullscreen, setFullscreen] = React.useState(false);

  const contextValue = React.useMemo(() => ({ fullscreen, setFullscreen }), [fullscreen]);

  if (fullscreen) {
    return (
      <FullscreenContext.Provider value={contextValue}>
        <div className="flex h-[calc(100vh-4rem)] flex-col">
          <div className="flex-1 overflow-hidden">{viewport}</div>
        </div>
      </FullscreenContext.Provider>
    );
  }

  return (
    <FullscreenContext.Provider value={contextValue}>
      <div className="flex h-[calc(100vh-4rem)] gap-4">
        <div className="min-h-0 w-1/4 overflow-auto">{collecte}</div>
        <div className="flex min-h-0 w-2/4 flex-col overflow-hidden">{viewport}</div>
        <div className="min-h-0 w-1/4 overflow-auto">{assistant}</div>
      </div>
    </FullscreenContext.Provider>
  );
}
