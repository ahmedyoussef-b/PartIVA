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
import { ChevronLeft, ChevronRight, GitCompareArrows, History } from 'lucide-react';
import { getPartStatusLabel } from '@/lib/enum-labels';
import type { PartStatus } from '@/generated/prisma/browser';
import type { VersionDiff } from '@/lib/part-version-diff';

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

const DIFF_FIELDS: Record<string, string> = {
  status: 'Statut',
  ptvReference: 'Réf. PTV',
  partNumber: 'N° pièce',
  name: 'Nom',
  description: 'Description',
};

export function PartVersionHistory({ partId }: PartVersionHistoryProps) {
  const [versions, setVersions] = React.useState<PartVersion[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<PartVersion | null>(null);
  const [compareFrom, setCompareFrom] = React.useState<PartVersion | null>(null);
  const [compareTo, setCompareTo] = React.useState<PartVersion | null>(null);
  const [diff, setDiff] = React.useState<{
    from: number;
    to: number;
    diffs: VersionDiff[];
  } | null>(null);
  const [diffLoading, setDiffLoading] = React.useState(false);
  const [diffError, setDiffError] = React.useState<string | null>(null);

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

  function diffValue(value: unknown) {
    if (value === null || value === undefined) {
      return '—';
    }
    return String(value);
  }

  function toggleCompare(version: PartVersion) {
    if (compareFrom?.id === version.id) {
      setCompareFrom(null);
      setDiff(null);
      return;
    }
    if (compareTo?.id === version.id) {
      setCompareTo(null);
      setDiff(null);
      return;
    }
    if (!compareFrom) {
      setCompareFrom(version);
      return;
    }
    if (!compareTo) {
      setCompareTo(version);
      return;
    }
    setCompareFrom(version);
    setCompareTo(null);
    setDiff(null);
  }

  async function runCompare() {
    if (!compareFrom || !compareTo) {
      return;
    }
    setDiffLoading(true);
    setDiffError(null);
    setDiff(null);
    try {
      const res = await fetch(
        `/api/parts/${partId}/versions/diff?from=${compareFrom.versionNumber}&to=${compareTo.versionNumber}`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setDiff({ from: data.from, to: data.to, diffs: data.diffs ?? [] });
    } catch (error) {
      setDiffError(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setDiffLoading(false);
    }
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
          {total > 1 ? 's' : ''} — snapshot des champs métier à chaque modification. Cliquez sur
          deux versions pour les comparer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(compareFrom || compareTo) && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px]">
              A : v{compareFrom?.versionNumber ?? '…'}
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px]">
              B : v{compareTo?.versionNumber ?? '…'}
            </Badge>
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              disabled={!compareFrom || !compareTo || diffLoading}
              onClick={runCompare}
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              {diffLoading ? 'Comparaison…' : 'Comparer'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => {
                setCompareFrom(null);
                setCompareTo(null);
                setDiff(null);
                setDiffError(null);
              }}
            >
              Réinitialiser
            </Button>
          </div>
        )}

        {diffError && <p className="text-destructive text-xs">{diffError}</p>}

        {diff && (
          <div className="border-input rounded-md border p-3">
            <p className="mb-2 text-xs font-semibold">
              Diff v{diff.from} → v{diff.to}
            </p>
            {diff.diffs.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Aucun changement entre ces deux versions.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Champ</TableHead>
                    <TableHead>Avant (v{diff.from})</TableHead>
                    <TableHead>Après (v{diff.to})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diff.diffs.map((d) => (
                    <TableRow key={d.field}>
                      <TableCell className="text-xs font-medium">
                        {DIFF_FIELDS[d.field] ?? d.field}
                      </TableCell>
                      <TableCell className="text-xs">{diffValue(d.before)}</TableCell>
                      <TableCell className="text-xs">{diffValue(d.after)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

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
                    <TableHead className="w-[90px] text-right">Diff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => {
                    const isA = compareFrom?.id === version.id;
                    const isB = compareTo?.id === version.id;
                    return (
                      <TableRow
                        key={version.id}
                        className="hover:bg-muted/30 cursor-pointer"
                        data-selected={selected?.id === version.id}
                        onClick={() =>
                          setSelected((current) => (current?.id === version.id ? null : version))
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="font-mono text-xs">
                              v{version.versionNumber}
                            </Badge>
                            {isA && <Badge className="font-mono text-[9px]">A</Badge>}
                            {isB && (
                              <Badge variant="secondary" className="font-mono text-[9px]">
                                B
                              </Badge>
                            )}
                          </div>
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
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={isA || isB ? 'default' : 'outline'}
                            className="h-6 px-2 text-[10px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompare(version);
                            }}
                            aria-label={`Comparer version ${version.versionNumber}`}
                          >
                            {isA ? 'A' : isB ? 'B' : 'Comparer'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
