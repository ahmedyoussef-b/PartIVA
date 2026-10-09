'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, PlusCircle, Eye, Filter } from 'lucide-react';
import { mapRequestToUi, type RequestWithRelations } from '@/lib/utils/request-mappers';
import { FR } from '@/i18n/fr';
import { formatDate } from '@/lib/utils';

interface DemandesClientProps {
  initialRequests: RequestWithRelations[];
}

export default function DemandesClient({ initialRequests }: DemandesClientProps) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const requests = React.useMemo(() => initialRequests.map(mapRequestToUi), [initialRequests]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter((req) => {
      const matchSearch =
        req.partDescription.toLowerCase().includes(q) ||
        (req.machineRef && req.machineRef.toLowerCase().includes(q)) ||
        req.id.slice(0, 8).includes(q);
      const matchStatus = statusFilter === 'all' ? true : req.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, search, statusFilter]);

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Mes Demandes</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Historique complet des pièces soumises pour modélisation et usinage CNC.
          </p>
        </div>
        <Link href="/demande">
          <Button className="gap-2 font-bold shadow-md">
            <PlusCircle className="h-4 w-4" />
            Nouvelle demande
          </Button>
        </Link>
      </div>

      {/* Filter toolbar */}
      <div className="bg-card/60 flex flex-col items-center justify-between gap-4 rounded-xl border p-4 backdrop-blur sm:flex-row">
        <div className="relative w-full sm:w-80">
          <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
          <Input
            placeholder="Rechercher par mot-clé, machine, référence..."
            className="pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Filter className="text-muted-foreground mr-1 h-3.5 w-3.5" />
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setStatusFilter('all')}
          >
            Toutes
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'searching' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setStatusFilter('searching')}
          >
            Recherche
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'reverse_engineering' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setStatusFilter('reverse_engineering')}
          >
            Reverse CAO
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'machining' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setStatusFilter('machining')}
          >
            Usinage CNC
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Réf. Dossier</TableHead>
                  <TableHead>Pièce &amp; Description</TableHead>
                  <TableHead>Machine d&apos;origine</TableHead>
                  <TableHead className="text-center">Qté</TableHead>
                  <TableHead>Urgence</TableHead>
                  <TableHead>Statut Actuel</TableHead>
                  <TableHead>Date d&apos;envoi</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/30">
                    <TableCell className="text-primary font-mono text-xs font-bold">
                      {req.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="line-clamp-1 text-xs font-medium">{req.partDescription}</div>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        Matière : {req.suspectedMaterial || 'Non précisée'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {req.machineRef || '—'}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs font-bold">
                      {req.quantity}
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
                      <Badge variant="secondary" className="text-[10px] font-medium">
                        {FR.statuses[req.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(req.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/client/dashboard/demandes/${req.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs">
                          <Eye className="h-3.5 w-3.5" />
                          Suivre
                        </Button>
                      </Link>
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
