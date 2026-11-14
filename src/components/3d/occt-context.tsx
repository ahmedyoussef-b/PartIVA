'use client';

import * as React from 'react';
import type { TopoDS_Shape } from 'libcascade';

interface OcctContextValue {
  shape: TopoDS_Shape | null;
  setShape: (shape: TopoDS_Shape | null) => void;
}

const OcctContext = React.createContext<OcctContextValue | undefined>(undefined);

export function OcctProvider({ children }: { children: React.ReactNode }) {
  const [shape, setShape] = React.useState<TopoDS_Shape | null>(null);
  return <OcctContext.Provider value={{ shape, setShape }}>{children}</OcctContext.Provider>;
}

export function useOcctShape() {
  const context = React.useContext(OcctContext);
  if (!context) {
    throw new Error('useOcctShape must be used within OcctProvider');
  }
  return context;
}
