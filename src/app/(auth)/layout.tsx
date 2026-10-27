'use client';

import * as React from 'react';
import Link from 'next/link';
import { Cog } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-muted/20 to-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
          <Cog className="h-6 w-6 stroke-[2.2]" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-base leading-tight font-bold tracking-tight">PartIVA</span>
          <span className="font-mono text-[11px] text-muted-foreground uppercase">
            Plastiques Industriels
          </span>
        </div>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
