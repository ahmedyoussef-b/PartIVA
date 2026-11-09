'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SearchCandidate } from '@/schemas/search';

interface CandidateGalleryProps {
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

export function CandidateGallery({ candidates, onSelect, selectedId }: CandidateGalleryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {candidates.map((c) => (
        <Card
          key={c.id}
          className={`group cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg ${
            selectedId === c.id ? 'ring-2 ring-emerald-500' : ''
          }`}
          onClick={() => onSelect(c)}
        >
          <div className="relative aspect-square bg-muted">
            {c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.imageUrl}
                alt={c.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-part.svg';
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <span className="text-xs">Pas d&apos;image</span>
              </div>
            )}
            <Badge className="absolute top-1 right-1 bg-black/60 text-[10px] text-white">
              {Math.round(c.scores.global * 100)}%
            </Badge>
          </div>
          <div className="space-y-1 p-2">
            <p className="truncate text-xs font-semibold">{c.name}</p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">{c.reference}</p>
            <Badge variant="outline" className="text-[9px]">
              {SOURCE_LABELS[c.source] ?? c.source}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
