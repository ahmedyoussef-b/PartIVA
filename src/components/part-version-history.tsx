'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { getPartStatusLabel } from '@/lib/enum-labels';
import type { PartStatus } from '@/generated/prisma/browser';

interface PartVersion {
  id: string;
  versionNumber: number;
  snapshot: Record<string, unknown>;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
}

interface PartVersionHistoryProps {
  partId: string;
}

const SNAPSHOT_FIELDS = [
  { key: 'status', label: 'Statut' },
  { key: 'ptvReference', label: 'Réf. PTV' },
  { key: 'partNumber', label: 'N° pièce' },
  { key: 'name', label: 'Nom' },
  { key: 'description', label: 'Description' },
] as const;

const PAGE_SIZE = 10;

export function PartVersionHistory({ partId }: PartVersionHistoryProps) {
  const [versions, setVersions] = React.useState<PartVersion[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<PartVersion | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/parts/${partId}/versions?page=${page}&pageSize=${PAGE_SIZE}`);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setVersions([]);
            setTotal(0);
            return;
          }
          throw new Error(`Erreur ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setVersions(data.versions ?? []);
          setTotal(data.total ?? 0);
        }
      } catch {
        if (!cancelled) {
          setVersions([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [partId, page]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  function snapshotValue(version: PartVersion, key: string) {
    const value = version.snapshot[key];
    if (value === null || value === undefined) {
      return '—';
    }
    if (key === 'status') {
      return getPartStatusLabel(value as PartStatus);
    }
    return String(value);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Historique des versions
        </CardTitle>
        <CardDescription>
          {total} version{total > 1 ? 's' : ''} enregistrée
          {total > 1 ? 's' : ''} — snapshot des champs métier à chaque modification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground text-sm">Chargement…</p>
        ) : versions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucune version enregistrée pour cette pièce.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">Version</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Auteur</TableHead>
                    <TableHead>Champs modifiés</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow
                      key={version.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      data-selected={selected?.id === version.id}
                      onClick={() =>
                        setSelected((current) => (current?.id === version.id ? null : version))
                      }
                    >
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          v{version.versionNumber}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(version.createdAt)}</TableCell>
                      <TableCell className="text-xs">
                        {version.createdBy?.name ?? version.createdBy?.email ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {SNAPSHOT_FIELDS.map((field) => (
                            <Badge
                              key={field.key}
                              variant="secondary"
                              className="font-mono text-[10px]"
                            >
                              {field.label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs">
                  Page {page} / {totalPages}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    aria-label="Page précédente"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Page suivante"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {selected && (
              <div className="border-input rounded-md border p-3">
                <p className="mb-2 text-xs font-semibold">
                  Snapshot v{selected.versionNumber} — {formatDate(selected.createdAt)}
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Champ</TableHead>
                      <TableHead>Valeur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SNAPSHOT_FIELDS.map((field) => (
                      <TableRow key={field.key}>
                        <TableCell className="text-xs font-medium">{field.label}</TableCell>
                        <TableCell className="text-xs">
                          {snapshotValue(selected, field.key)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
