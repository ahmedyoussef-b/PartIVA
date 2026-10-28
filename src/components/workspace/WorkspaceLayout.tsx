'use client';

import { ReactNode } from 'react';

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="grid h-screen grid-cols-1 gap-4 p-4 lg:grid-cols-3">{children}</div>;
}
