'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { ExternalLink, Plus, Search, X } from 'lucide-react';
import type { UserRole, PartTemplate } from '@/generated/prisma/client';
import { DeleteTemplateButton } from './[id]/delete-template-button';

interface PartTemplatesClientProps {
  initialTemplates: PartTemplate[];
  actorRole: UserRole;
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

const SOURCE_METHODS = ['CATALOG', 'WORKSPACE', 'REVERSE', 'IMPORT'] as const;

export default function PartTemplatesClient({
  initialTemplates,
  actorRole,
}: PartTemplatesClientProps) {
  const [search, setSearch] = React.useState('');
  const [matFilter, setMatFilter] = React.useState<string>('all');
  const [sourceMethodFilter, setSourceMethodFilter] = React.useState<string>('all');

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return initialTemplates.filter((t) => {
      const okSearch =
        !q || t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q);
      const okMat = matFilter === 'all' || (t.material ?? '') === matFilter;
      const okMethod =
        sourceMethodFilter === 'all' || (t.sourceMethod ?? '') === sourceMethodFilter;
      return okSearch && okMat && okMethod;
    });
  }, [initialTemplates, search, matFilter, sourceMethodFilter]);

  const total = initialTemplates.length;
  const avecCao = initialTemplates.filter((t) => !!t.printableModelUrl).length;
  const avecCategorie = initialTemplates.filter((t) => !!t.categoryId).length;

  const materials = React.useMemo(
    () =>
      Array.from(new Set(initialTemplates.map((t) => t.material).filter((m): m is string => !!m))),
    [initialTemplates],
  );

  const hasFilters = search !== '' || matFilter !== 'all' || sourceMethodFilter !== 'all';

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates de pièces</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Modèles de pièces réutilisables pour accélérer la création de nouvelles pièces.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Rôle : {actorRole}</p>
        </div>
        <Button asChild size="sm" className="gap-2 text-xs font-semibold">
          <Link href="/admin/part-templates/nouveau">
            <Plus className="h-3.5 w-3.5" />
            Nouveau template
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Total" value={total} />
        <KpiCard label="Avec CAO" value={avecCao} />
        <KpiCard label="Avec catégorie" value={avecCategorie} />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un template…"
                className="pl-7"
              />
            </div>
            <select
              value={matFilter}
              onChange={(e) => setMatFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="all">Toutes matières</option>
              {materials.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={sourceMethodFilter}
              onChange={(e) => setSourceMethodFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="all">Toutes méthodes</option>
              {SOURCE_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => {
                  setSearch('');
                  setMatFilter('all');
                  setSourceMethodFilter('all');
                }}
              >
                <X className="h-3 w-3" />
                Effacer
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf.</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>CAO</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((template) => (
                  <TableRow key={template.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{template.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{template.name}</span>
                        {template.description && (
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {template.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {template.categoryId ? (
                        <span className="rounded bg-secondary px-2 py-0.5 text-xs">
                          {template.categoryId.slice(0, 8)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{template.material ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {template.sourceMethod ?? '—'}
                    </TableCell>
                    <TableCell>
                      {template.printableModelUrl ? (
                        <span className="rounded border border-blue-400 px-2 py-0.5 text-xs text-blue-600">
                          CAO
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs">
                          <Link href={`/admin/part-templates/${template.id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                            Fiche
                          </Link>
                        </Button>
                        <DeleteTemplateButton templateId={template.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                      {hasFilters ? 'Aucun template ne correspond aux filtres.' : 'Aucun template.'}
                      {!hasFilters && (
                        <div className="mt-3">
                          <Button asChild size="sm" className="gap-2 text-xs font-semibold">
                            <Link href="/admin/part-templates/nouveau">
                              <Plus className="h-3.5 w-3.5" />
                              Créer le premier
                            </Link>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
