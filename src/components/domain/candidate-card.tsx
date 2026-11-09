'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SimilarityScore } from './similarity-score';
import type { SearchCandidate } from '@/schemas/search';
import { Check, X, ExternalLink, Box, FileText } from 'lucide-react';

const getSourceBadge = (source: string) => {
  const config: Record<string, { label: string; className: string }> = {
    step_parts: {
      label: 'STEP Parts',
      className: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
    },
    industrial_catalog: {
      label: 'CADENAS',
      className: 'bg-violet-500/20 text-violet-700 border-violet-500/30',
    },
    fapi: { label: 'FAPI', className: 'bg-amber-500/20 text-amber-700 border-amber-500/30' },
    local_db: {
      label: 'BDD Locale',
      className: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
    },
    geometric: {
      label: 'Géométrique IA',
      className: 'bg-cyan-500/20 text-cyan-700 border-cyan-500/30',
    },
    traceparts: {
      label: 'TraceParts (Mock)',
      className: 'bg-gray-500/20 text-gray-700 border-gray-500/30',
    },
  };
  const c = config[source] ?? { label: source, className: 'bg-muted text-muted-foreground' };
  return (
    <Badge variant="outline" className={`text-[10px] font-semibold ${c.className}`}>
      {c.label}
    </Badge>
  );
};

interface CandidateCardProps {
  candidate: SearchCandidate;
  onValidate?: (c: SearchCandidate) => void;
  onReject?: (c: SearchCandidate) => void;
  onView?: (c: SearchCandidate) => void;
  // Selection mode props
  sourceLabel?: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function CandidateCard({
  candidate,
  onValidate,
  onReject,
  onView,
  isSelected,
  onSelect,
}: CandidateCardProps) {
  const isMatchHigh = candidate.scores.global >= 0.7;

  return (
    <Card
      className={`cursor-pointer shadow-sm transition-all hover:border-primary/50 ${
        isSelected ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary">{candidate.reference}</span>
            {getSourceBadge(candidate.source)}
          </div>
          <h3 className="line-clamp-1 text-sm font-semibold">{candidate.name}</h3>
          {candidate.manufacturer && (
            <p className="text-xs text-muted-foreground">{candidate.manufacturer}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div
            className={`font-mono text-2xl font-bold ${
              isMatchHigh ? 'text-emerald-500' : 'text-amber-500'
            }`}
          >
            {Math.round(candidate.scores.global * 100)}%
          </div>
          <div className="text-[10px] text-muted-foreground">score global</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {candidate.imageUrl && (
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md border bg-muted/50 transition-transform duration-700 ease-out group-hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={candidate.imageUrl}
              alt={candidate.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = '/placeholder-part.svg';
                img.className = 'h-full w-full object-contain p-8 opacity-60';
              }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-black/5 ring-inset" />
          </div>
        )}
        <div className="space-y-2">
          {candidate.scores.geometry !== undefined && (
            <SimilarityScore score={candidate.scores.geometry} label="Géométrie 3D" size="sm" />
          )}
          {candidate.scores.dimensions !== undefined && (
            <SimilarityScore score={candidate.scores.dimensions} label="Dimensions" size="sm" />
          )}
          {candidate.scores.material !== undefined && (
            <SimilarityScore
              score={candidate.scores.material}
              label="Matériau technique"
              size="sm"
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {candidate.cadAvailable && (
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <Box className="h-3 w-3" /> CAD dispo
            </Badge>
          )}
          {candidate.datasheetAvailable && (
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <FileText className="h-3 w-3" /> Fiche technique
            </Badge>
          )}
        </div>
        <div className="flex gap-2 border-t pt-2">
          <Button
            size="sm"
            variant={isMatchHigh ? 'default' : 'outline'}
            className="flex-1 font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              if (onValidate) onValidate(candidate);
              else alert('Validation non configurée');
            }}
          >
            <Check className="mr-1.5 h-4 w-4" /> Valider (≥70%)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              if (onReject) onReject(candidate);
              else alert('Rejet non configuré');
            }}
            aria-label="Rejeter"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              if (onView) onView(candidate);
              else alert('Vue détaillée non configurée');
            }}
            aria-label="Voir détails"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
