'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface ResultFilters {
  minScore: number;
  manufacturer: string | null;
  source: string | null;
}

interface ResultFiltersProps {
  filters: ResultFilters;
  onFiltersChange: (filters: ResultFilters) => void;
  manufacturers: string[];
  sources: string[];
}

export function ResultFiltersBar({
  filters,
  onFiltersChange,
  manufacturers,
  sources,
}: ResultFiltersProps) {
  const hasActiveFilters =
    filters.minScore > 0 || filters.manufacturer !== null || filters.source !== null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-3">
      <span className="text-xs font-semibold text-muted-foreground">Filtres :</span>

      {/* Score minimum */}
      <select
        value={filters.minScore}
        onChange={(e) => onFiltersChange({ ...filters, minScore: Number(e.target.value) })}
        className="rounded-md border border-input bg-background px-2 py-1 text-xs"
      >
        <option value={0}>Tous les scores</option>
        <option value={50}>Score ≥ 50%</option>
        <option value={70}>Score ≥ 70%</option>
        <option value={80}>Score ≥ 80%</option>
      </select>

      {/* Fabricant */}
      <select
        value={filters.manufacturer ?? ''}
        onChange={(e) =>
          onFiltersChange({ ...filters, manufacturer: e.target.value || null })
        }
        className="rounded-md border border-input bg-background px-2 py-1 text-xs"
      >
        <option value="">Tous les fabricants</option>
        {manufacturers.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {/* Source */}
      <select
        value={filters.source ?? ''}
        onChange={(e) => onFiltersChange({ ...filters, source: e.target.value || null })}
        className="rounded-md border border-input bg-background px-2 py-1 text-xs"
      >
        <option value="">Toutes les sources</option>
        {sources.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange({ minScore: 0, manufacturer: null, source: null })}
          className="h-7 gap-1 text-xs"
        >
          <X className="h-3 w-3" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
