'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CompletenessBadgeProps {
  /** Score de complétude (0-1). */
  score: number;
  /** Liste des clés de spécifications requises manquantes. */
  missingFields?: string[];
}

/**
 * Badge de complétude client (D-E4-1, D-completeness-client-ui).
 *
 * Affiche une barre de progression colorée (vert ≥ 80 %,
 * ambre ≥ 50 %, rouge < 50 %), le pourcentage et le nombre
 * de champs manquants. Les données proviennent de
 * `GET /api/parts/[id]/completeness` (backend E2).
 */
export function CompletenessBadge({ score, missingFields = [] }: CompletenessBadgeProps) {
  const pct = Math.round(Math.min(1, Math.max(0, score)) * 100);
  const tone = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Complétude ${pct} %`}
        className="relative h-2 w-32 overflow-hidden rounded-full bg-primary/20"
      >
        <div
          className={cn('h-full transition-all duration-300', tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold">{pct} %</span>
      {missingFields.length > 0 && (
        <Badge variant="secondary" className="font-mono text-[10px]">
          {missingFields.length} champ
          {missingFields.length > 1 ? 's' : ''} manquant
          {missingFields.length > 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}
