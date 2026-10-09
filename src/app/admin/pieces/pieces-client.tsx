'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { KPICard } from '@/components/shared/kpi-card';
import { FilterBar } from '@/components/shared/filter-bar';
import { Eye, FileDown } from 'lucide-react';
import type { PartWithSerializedSuppliers } from '@/lib/data/parts';

const STATUS_STYLES: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'critical' }
> = {
  active: { label: 'Validée', variant: 'default' },
  draft: { label: 'Brouillon', variant: 'outline' },
  archived: { label: 'Archivée', variant: 'secondary' },
};

interface PiecesClientProps {
  initialParts: PartWithSerializedSuppliers[];
}

function mapPartToUi(part: PartWithSerializedSuppliers) {
  return {
    ...part,
    reference: part.partNumber,
    status: part.status.toLowerCase(),
    suppliers: part.suppliers.map((s) => ({
      ...s,
      price: s.price ? s.price.toString() : null,
    })),
  };
}

export default function PiecesClient({ initialParts }: PiecesClientProps) {
  const [search, setSearch] = React.useState('');
  const [matFilter, setMatFilter] = React.useState('all');

  const parts = React.useMemo(() => initialParts.map(mapPartToUi), [initialParts]);

  const allMaterials = React.useMemo(
    () => [...new Set(parts.map((p) => p.material).filter((m): m is string => Boolean(m)))],
    [parts],
  );

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return parts.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false);
      const matchMat = matFilter === 'all' || p.material === matFilter;
      return matchSearch && matchMat;
    });
  }, [parts, search, matFilter]);

  const stats = React.useMemo(() => {
    const total = parts.length;
    const validated = parts.filter((p) => p.status === 'active').length;
    const draft = parts.filter((p) => p.status === 'draft').length;
    const withCad = parts.filter((p) => (p.files?.cad?.length ?? 0) > 0).length;
    return { total, validated, draft, withCad };
  }, [parts]);

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catalogue pièces</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pièces usinées, indexées et disponibles pour réutilisation.
          </p>
        </div>
        <Button className="gap-2 text-xs font-semibold">Nouvelle pièce</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Total références" value={stats.total} />
        <KPICard title="Validées" value={stats.validated} variant="success" />
        <KPICard title="Brouillons" value={stats.draft} variant="warning" />
        <KPICard title="Avec CAO" value={stats.withCad} variant="info" />
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Référence, nom, description…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={allMaterials.map((m) => ({ label: m, value: m }))}
        activeFilters={matFilter !== 'all' ? [matFilter] : []}
        onFilterChange={(val) => setMatFilter(val === matFilter ? 'all' : val)}
        onClearFilters={() => {
          setSearch('');
          setMatFilter('all');
        }}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Réf.</TableHead>
                  <TableHead>Pièce</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Fichiers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((part) => {
                  const st = STATUS_STYLES[part.status] ?? {
                    label: part.status,
                    variant: 'outline' as const,
                  };
                  const hasCad = (part.files?.cad?.length ?? 0) > 0;
                  const hasPlan = (part.files?.plans?.length ?? 0) > 0;
                  return (
                    <TableRow key={part.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {part.reference}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">{part.name}</div>
                        <div className="line-clamp-1 text-[11px] text-muted-foreground">
                          {part.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {part.material}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant} className="text-[10px]">
                          {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {hasCad && (
                            <Badge
                              variant="outline"
                              className="border-blue-500/40 font-mono text-[9px] text-blue-600"
                            >
                              CAO
                            </Badge>
                          )}
                          {hasPlan && (
                            <Badge
                              variant="outline"
                              className="border-violet-500/40 font-mono text-[9px] text-violet-600"
                            >
                              PLAN
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs">
                            <Eye className="h-3.5 w-3.5" />
                            Voir
                          </Button>
                          {hasCad && (
                            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                              <FileDown className="h-3.5 w-3.5" />
                              STEP
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
