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
import { PartStatusBadge } from '@/components/part-status-badge';
import { PartTransitionDialog } from '@/components/part-transition-dialog';
import { PartVersionHistory } from '@/components/part-version-history';
import { PartSpecificationTable } from '@/components/part-specification-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, FileDown } from 'lucide-react';
import type { PartWithSerializedSuppliers } from '@/lib/data/parts';
import type { UserRole } from '@/generated/prisma/browser';

interface PiecesClientProps {
  initialParts: PartWithSerializedSuppliers[];
  actorRole: UserRole;
}

function mapPartToUi(part: PartWithSerializedSuppliers) {
  return {
    ...part,
    reference: part.partNumber,
    status: part.status,
    suppliers: part.suppliers.map((s) => ({
      ...s,
      price: s.price ? s.price.toString() : null,
    })),
  };
}

export default function PiecesClient({ initialParts, actorRole }: PiecesClientProps) {
  const [search, setSearch] = React.useState('');
  const [matFilter, setMatFilter] = React.useState('all');

  const [selectedPartId, setSelectedPartId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('catalogue');

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
    const validated = parts.filter((p) => p.status === 'READY').length;
    const draft = parts.filter((p) => p.status === 'DRAFT').length;
    const withCad = parts.filter((p) => (p.files?.cad?.length ?? 0) > 0).length;
    return { total, validated, draft, withCad };
  }, [parts]);

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catalogue pièces</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
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
      <Tabs
        value={selectedPartId ?? 'catalogue'}
        onValueChange={(v) => {
          setSelectedPartId(v === 'catalogue' ? null : v);
          setActiveTab('catalogue');
        }}
      >
        <TabsList>
          <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
          {selectedPartId && <TabsTrigger value={selectedPartId}>Pièce</TabsTrigger>}
        </TabsList>
        <TabsContent value="catalogue">
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
                      const hasCad = (part.files?.cad?.length ?? 0) > 0;
                      const hasPlan = (part.files?.plans?.length ?? 0) > 0;
                      return (
                        <TableRow key={part.id} className="hover:bg-muted/30">
                          <TableCell className="text-primary font-mono text-xs font-bold">
                            {part.reference}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-medium">{part.name}</div>
                            <div className="text-muted-foreground line-clamp-1 text-[11px]">
                              {part.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {part.material}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <PartStatusBadge status={part.status} />
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
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-1 text-xs"
                                onClick={() => setSelectedPartId(part.id)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Voir
                              </Button>
                              {hasCad && (
                                <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                                  <FileDown className="h-3.5 w-3.5" />
                                  STEP
                                </Button>
                              )}
                              <PartTransitionDialog
                                partId={part.id}
                                currentStatus={part.status}
                                actorRole={actorRole}
                              />
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
        </TabsContent>
        {selectedPartId && (
          <TabsContent value={selectedPartId}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="historique">Historique</TabsTrigger>
                <TabsTrigger value="mesures">Mesures</TabsTrigger>
              </TabsList>
              <TabsContent value="historique">
                <PartVersionHistory partId={selectedPartId} />
              </TabsContent>
              <TabsContent value="mesures">
                <PartSpecificationTable
                  partId={selectedPartId}
                  initialSpecifications={
                    parts.find((p) => p.id === selectedPartId)?.specifications ?? []
                  }
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
