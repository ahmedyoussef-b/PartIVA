'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { PART_STATUS_VALUES, type PartStatusValue } from '@/lib/search-constants';
import { getPartStatusLabel } from '@/lib/enum-labels';

export type SearchFilters = {
  material: string;
  status: string;
  createdAfter: string;
  createdBefore: string;
  minScore: string;
  machineId: string;
};

export const EMPTY_FILTERS: SearchFilters = {
  material: '',
  status: '',
  createdAfter: '',
  createdBefore: '',
  minScore: '',
  machineId: '',
};

interface FiltersPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  availableMaterials: string[];
}

export function FiltersPanel({ filters, onChange, availableMaterials }: FiltersPanelProps) {
  const [open, setOpen] = React.useState(false);
  const activeCount = Object.values(filters).filter((v) => v !== '').length;

  const update = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const reset = () => onChange(EMPTY_FILTERS);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border-input bg-background hover:bg-muted/50 flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs font-medium"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          Filtres avancés
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {activeCount} actif{activeCount > 1 ? 's' : ''}
            </Badge>
          )}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <Card>
          <CardContent className="space-y-3 p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-muted-foreground mb-1 block text-[11px]">Matériau</label>
                    <select
                      value={filters.material}
                      onChange={(e) => update('material', e.target.value)}
                      className="border-input bg-background text-foreground w-full rounded-md border px-2 py-1.5 text-xs"
                    >
                      <option value="">Tous les matériaux</option>
                      {availableMaterials.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-muted-foreground mb-1 block text-[11px]">Machine</label>
                    <select
                      value={filters.machineId}
                      onChange={(e) => update('machineId', e.target.value)}
                      className="border-input bg-background text-foreground w-full rounded-md border px-2 py-1.5 text-xs"
                    >
                      <option value="">Toutes les machines</option>
                      {availableMaterials.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-[11px]">Statut</label>
                <select
                  value={filters.status}
                  onChange={(e) => update('status', e.target.value)}
                  className="border-input bg-background text-foreground w-full rounded-md border px-2 py-1.5 text-xs"
                >
                  <option value="">Tous les statuts</option>
                  {PART_STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {getPartStatusLabel(s as PartStatusValue)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-[11px]">Créé après</label>
                <Input
                  type="date"
                  value={filters.createdAfter}
                  onChange={(e) => update('createdAfter', e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-[11px]">Créé avant</label>
                <Input
                  type="date"
                  value={filters.createdBefore}
                  onChange={(e) => update('createdBefore', e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-muted-foreground mb-1 block text-[11px]">
                  Score minimum ({filters.minScore || '0'})
                </label>
                <Input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={filters.minScore || '0'}
                  onChange={(e) => update('minScore', e.target.value === '0' ? '' : e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            {activeCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reset}
                className="gap-1 text-xs"
              >
                <X className="h-3 w-3" />
                Réinitialiser les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
