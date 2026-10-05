'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import type { Material } from '@/schemas/part';
import { cn } from '@/lib/utils';

interface MaterialBadgeProps {
  material?: Material | string;
  className?: string;
}

const MATERIAL_COLORS: Record<string, string> = {
  'POM-C': 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  'POM-H': 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  PA6: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  PA66: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  PEHD: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  PEBD: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
  PTFE: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'UHMW-PE': 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  PVC: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  PEEK: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  ABS: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  PETP: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
};

export function MaterialBadge({ material, className }: MaterialBadgeProps) {
  if (!material) {
    return (
      <Badge variant="outline" className={cn('text-xs', className)}>
        Inconnu
      </Badge>
    );
  }

  const colorClass = MATERIAL_COLORS[material] ?? 'bg-muted text-muted-foreground';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs font-semibold transition-colors',
        colorClass,
        className,
      )}
    >
      {material}
    </span>
  );
}
