'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SimilarityScore } from './similarity-score';
import type { SearchCandidate } from '@/schemas/search';
import { Check, X, ExternalLink, Box, FileText } from 'lucide-react';

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
  sourceLabel,
  isSelected,
  onSelect,
}: CandidateCardProps) {
  const isMatchHigh = candidate.scores.global >= 0.7;

  return (
    <Card
      className={`hover:border-primary/50 cursor-pointer shadow-sm transition-all ${
        isSelected ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-primary font-mono text-xs font-bold">{candidate.reference}</span>
            <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase">
              {sourceLabel ?? candidate.source.replace('_', ' ')}
            </Badge>
          </div>
          <h3 className="line-clamp-1 text-sm font-semibold">{candidate.name}</h3>
          {candidate.manufacturer && (
            <p className="text-muted-foreground text-xs">{candidate.manufacturer}</p>
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
          <div className="text-muted-foreground text-[10px]">score global</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {candidate.imageUrl && (
          <div className="bg-muted/50 relative flex aspect-video items-center justify-center overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={candidate.imageUrl}
              alt={candidate.name}
              className="h-full w-full object-cover"
            />
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
            onClick={() => onValidate?.(candidate)}
          >
            <Check className="mr-1.5 h-4 w-4" /> Valider (≥70%)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject?.(candidate)}
            aria-label="Rejeter"
          >
            <X className="text-muted-foreground h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView?.(candidate)}
            aria-label="Voir détails"
          >
            <ExternalLink className="text-muted-foreground h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
