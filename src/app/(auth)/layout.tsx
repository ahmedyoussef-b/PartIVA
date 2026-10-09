'use client';

import * as React from 'react';
import Link from 'next/link';
import { Cog } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="from-background via-muted/20 to-background flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg shadow-md">
          <Cog className="h-6 w-6 stroke-[2.2]" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-base leading-tight font-bold tracking-tight">PartIVA</span>
          <span className="text-muted-foreground font-mono text-[11px] uppercase">
            Plastiques Industriels
          </span>
        </div>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
