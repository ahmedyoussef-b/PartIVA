'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SOURCE_WEIGHTS } from '@/lib/scoring/weights';
import type { ScoringSource } from '@/lib/scoring/weights';

/**
 * Tableau des poids de scoring inter-sources (D-E4-1, D-scoring-weights-ui).
 *
 * Affichage READ-ONLY des poids du pipeline d'agrégation (E4-S03) :
 * chaque source expose son poids (D-E3-23) et son timeout (D-E3-31).
 * La modification des poids sera disponible dans une session dédiée
 * (avec persistance — D-E4-3).
 */
export function ScoringWeightsTable() {
  const sources = Object.keys(SOURCE_WEIGHTS) as ScoringSource[];

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Poids</TableHead>
              <TableHead className="text-right">Timeout</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => {
              const config = SOURCE_WEIGHTS[source];
              return (
                <TableRow key={source}>
                  <TableCell className="font-mono text-xs font-medium">{source}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {config.weight.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {config.timeoutMs / 1000} s
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-[10px]">
          Lecture seule
        </Badge>
        <p className="text-xs text-muted-foreground">
          La modification des poids sera disponible dans une session dédiée.
        </p>
      </div>
    </div>
  );
}
