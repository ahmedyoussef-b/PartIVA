'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SimilarityScore } from './similarity-score'
import type { SearchCandidate } from '@/schemas/search'
import { Check, X, ExternalLink, Box, FileText } from 'lucide-react'

interface CandidateCardProps {
  candidate: SearchCandidate
  onValidate?: (c: SearchCandidate) => void
  onReject?: (c: SearchCandidate) => void
  onView?: (c: SearchCandidate) => void
  // Selection mode props
  sourceLabel?: string
  isSelected?: boolean
  onSelect?: () => void
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
  const isMatchHigh = candidate.scores.global >= 0.7

  return (
    <Card
      className={`hover:border-primary/50 transition-all shadow-sm cursor-pointer ${
        isSelected ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-500/5' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary">{candidate.reference}</span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
              {sourceLabel ?? candidate.source.replace('_', ' ')}
            </Badge>
          </div>
          <h3 className="font-semibold text-sm line-clamp-1">{candidate.name}</h3>
          {candidate.manufacturer && (
            <p className="text-xs text-muted-foreground">{candidate.manufacturer}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div
            className={`text-2xl font-bold font-mono ${
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
          <div className="aspect-video bg-muted/50 rounded-md overflow-hidden relative border flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={candidate.imageUrl}
              alt={candidate.name}
              className="w-full h-full object-cover"
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
            <SimilarityScore score={candidate.scores.material} label="Matériau technique" size="sm" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {candidate.cadAvailable && (
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <Box className="w-3 h-3" /> CAD dispo
            </Badge>
          )}
          {candidate.datasheetAvailable && (
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <FileText className="w-3 h-3" /> Fiche technique
            </Badge>
          )}
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant={isMatchHigh ? 'default' : 'outline'}
            className="flex-1 font-semibold"
            onClick={() => onValidate?.(candidate)}
          >
            <Check className="w-4 h-4 mr-1.5" /> Valider (≥70%)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject?.(candidate)}
            aria-label="Rejeter"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView?.(candidate)}
            aria-label="Voir détails"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
