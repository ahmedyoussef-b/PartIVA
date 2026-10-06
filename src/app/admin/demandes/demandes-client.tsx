'use client';

import * as React from 'react';
import Link from 'next/link';
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
import { FilterBar } from '@/components/shared/filter-bar';
import { Search } from 'lucide-react';
import { mapRequestToUi, type RequestWithRelations } from '@/lib/utils/request-mappers';
import { FR } from '@/i18n/fr';

const STATUS_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'searching', label: 'En recherche' },
  { value: 'candidate_found', label: 'Candidat ≥70%' },
  { value: 'reverse_engineering', label: 'Reverse CAO' },
  { value: 'machining', label: 'Usinage' },
];

interface DemandesClientProps {
  initialRequests: RequestWithRelations[];
}

export default function DemandesClient({ initialRequests }: DemandesClientProps) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const requests = React.useMemo(() => initialRequests.map(mapRequestToUi), [initialRequests]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter((req) => {
      const matchSearch =
        req.partDescription.toLowerCase().includes(q) ||
        req.client.name.toLowerCase().includes(q) ||
        (req.client.company && req.client.company.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'all' ? true : req.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, search, statusFilter]);

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">File de fabrication</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Recherche multi-sources → Validation → Usinage CNC.
        </p>
      </div>

      <FilterBar
        searchPlaceholder="Rechercher par client, machine, description..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={STATUS_FILTERS}
        activeFilters={statusFilter !== 'all' ? [statusFilter] : []}
        onFilterChange={(val) => setStatusFilter(val === statusFilter ? 'all' : val)}
        onClearFilters={() => {
          setSearch('');
          setStatusFilter('all');
        }}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Réf.</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Pièce</TableHead>
                  <TableHead>Urgence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {req.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium">
                        {req.client.company || req.client.name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="line-clamp-1 text-xs">{req.partDescription}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={req.urgency === 'critical' ? 'critical' : 'outline'}
                        className="text-[10px]"
                      >
                        {FR.urgencies[req.urgency]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {FR.statuses[req.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/demandes/${req.id}/recherche`}>
                          <Button size="sm" className="h-8 gap-1 text-xs">
                            <Search className="h-3.5 w-3.5" />
                            Recherche
                          </Button>
                        </Link>
                        <Link href={`/admin/demandes/${req.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 text-xs">
                            Détails
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
