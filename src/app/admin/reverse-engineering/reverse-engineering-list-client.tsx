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
import { Wrench } from 'lucide-react';
import type { REProjectWithRelations } from '@/lib/data/reverse-engineering';

const PROJECT_STATUS_STYLES: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'critical' }
> = {
  DRAFT: { label: 'Brouillon', variant: 'outline' },
  IN_PROGRESS: { label: 'En cours', variant: 'default' },
  REVIEW: { label: 'En révision', variant: 'secondary' },
  COMPLETED: { label: 'Terminé', variant: 'default' },
  CANCELLED: { label: 'Annulé', variant: 'outline' },
};

interface ReverseEngineeringListClientProps {
  initialProjects: REProjectWithRelations[];
}

export default function ReverseEngineeringListClient({ initialProjects }: ReverseEngineeringListClientProps) {
  const projects = React.useMemo(() => initialProjects, [initialProjects]);

  const filtered = React.useMemo(() => {
    return projects.filter((project) => {
      const matchName = project.name.toLowerCase().includes('');
      const matchDescription = project.description?.toLowerCase().includes('') ?? false;
      const matchRequest = project.requests.some((req) =>
        req.partDescription.toLowerCase().includes('')
      );
      return matchName || matchDescription || matchRequest;
    });
  }, [projects]);

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reverse Engineering</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Projets de rétro-ingénierie CAO — {projects.length} projet(s)
          </p>
        </div>
        <Button className="gap-2 text-xs font-semibold">Nouveau projet RE</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Demande(s)</TableHead>
                  <TableHead>Étapes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((project) => {
                  const style = PROJECT_STATUS_STYLES[project.status] ?? {
                    label: project.status,
                    variant: 'outline' as const,
                  };
                  const completedSteps = project.steps.filter((s) => s.completed).length;
                  return (
                    <TableRow key={project.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {project.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">{project.name}</div>
                        <div className="line-clamp-1 text-[11px] text-muted-foreground">
                          {project.description || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={style.variant} className="text-[10px]">
                          {style.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {project.requests.length} demande(s)
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {completedSteps}/{project.steps.length} étapes
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/reverse-engineering/${project.id}`}>
                            <Button size="sm" className="h-8 gap-1 text-xs">
                              <Wrench className="h-3.5 w-3.5" />
                              Ouvrir
                            </Button>
                          </Link>
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
