'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SearchCandidate } from '@/schemas/search';

interface CandidateTableProps {
  candidates: SearchCandidate[];
  onSelect: (c: SearchCandidate) => void;
  selectedId?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  step_parts: 'STEP Parts',
  industrial_catalog: 'CADENAS',
  fapi: 'FAPI',
  local_db: 'BDD Locale',
  geometric: 'Géométrique IA',
  wikidata: 'Wikidata',
  traceparts: 'TraceParts',
  tecdoc: 'TecDoc',
  '3dcarparts': '3D Car Parts',
};

export function CandidateTable({ candidates, onSelect, selectedId }: CandidateTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Référence</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Fabricant</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((c) => (
            <TableRow
              key={c.id}
              className={`cursor-pointer hover:bg-muted/30 ${
                selectedId === c.id ? 'bg-emerald-500/10' : ''
              }`}
              onClick={() => onSelect(c)}
            >
              <TableCell>
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    className="h-8 w-8 rounded object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-part.svg';
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell className="font-mono text-xs">{c.reference}</TableCell>
              <TableCell className="text-xs font-medium">{c.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px]">
                  {SOURCE_LABELS[c.source] ?? c.source}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {c.manufacturer ?? '—'}
              </TableCell>
              <TableCell className="text-right font-mono text-xs font-bold">
                {Math.round(c.scores.global * 100)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
