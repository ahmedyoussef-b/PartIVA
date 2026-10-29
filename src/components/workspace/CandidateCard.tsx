'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, Plus, Download, ThumbsUp, ThumbsDown } from 'lucide-react';
import { downloadStl } from '@/lib/export/stl-export';
import { convertCandidateToPart } from '@/lib/actions/convert-candidate';
import type { SearchCandidate } from '@/core/ai-engine/skills/search/types';

interface CandidateCardProps {
  candidate: SearchCandidate;
  onSelect?: (id: string) => void;
  isAdmin?: boolean;
}

export function CandidateCard({ candidate, onSelect, isAdmin = false }: CandidateCardProps) {
  const scorePct = Math.round((candidate.score ?? 0) * 100);
  const barColor =
    scorePct >= 80 ? 'bg-green-500' : scorePct >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [conversionMessage, setConversionMessage] = useState('');
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  async function handleFeedback(rating: number) {
    setIsFeedbackLoading(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id, rating }),
      });
      setFeedbackRating(rating);
    } finally {
      setIsFeedbackLoading(false);
    }
  }

  async function handleConvert() {
    setIsConverting(true);
    setConversionStatus('idle');
    try {
      const result = await convertCandidateToPart(candidate);
      if (result.success) {
        setConversionStatus('success');
        setConversionMessage(`Pièce créée : ${result.partId}`);
      } else {
        setConversionStatus('error');
        setConversionMessage(result.error || 'Échec de la conversion');
      }
    } catch (e) {
      setConversionStatus('error');
      setConversionMessage(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setIsConverting(false);
    }
  }

  const canConvert = isAdmin;

  return (
    <Card className="mb-2">
      <CardHeader className="flex flex-row items-center gap-3 p-3">
        {candidate.thumbnailUrl ? (
          <img
            src={candidate.thumbnailUrl}
            alt={candidate.name}
            className="h-12 w-12 rounded object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
            <Box className="h-6 w-6 text-gray-400" />
          </div>
        )}
        <div className="flex-1">
          <CardTitle className="text-sm">{candidate.name}</CardTitle>
          <span className="text-xs text-gray-500">
            {candidate.source === 'local' ? 'Local' : 'Web'}
          </span>
        </div>
        {candidate.fileUrl && onSelect && (
          <button
            type="button"
            onClick={() => onSelect(candidate.id)}
            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
          >
            Voir
          </button>
        )}
        {candidate.fileUrl &&
          (candidate.fileUrl.endsWith('.stl') ||
            candidate.fileUrl.startsWith('data:application/stl')) && (
            <button
              type="button"
              onClick={() => downloadStl(candidate.fileUrl!, `piece-${candidate.id}-printable.stl`)}
              className="rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-800"
              title="Exporter en STL"
            >
              <Download className="h-3 w-3" />
            </button>
          )}
        <button
          type="button"
          disabled={isFeedbackLoading}
          onClick={() => handleFeedback(1)}
          className={`rounded px-2 py-1 text-xs ${feedbackRating === 1 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          title="Pertinent"
        >
          <ThumbsUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          disabled={isFeedbackLoading}
          onClick={() => handleFeedback(-1)}
          className={`rounded px-2 py-1 text-xs ${feedbackRating === -1 ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          title="Non pertinent"
        >
          <ThumbsDown className="h-3 w-3" />
        </button>
        {canConvert && (
          <button
            type="button"
            onClick={handleConvert}
            disabled={isConverting}
            className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={isAdmin ? 'Convertir en pièce' : 'Réservé aux administrateurs'}
          >
            {isConverting ? '…' : <Plus className="h-3 w-3" />}
          </button>
        )}
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-gray-200">
            <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${scorePct}%` }} />
          </div>
          <span className="text-xs font-medium text-gray-700">{scorePct}%</span>
        </div>
        {conversionStatus !== 'idle' && (
          <div className="mt-2 text-xs">
            {conversionStatus === 'success' ? (
              <span className="text-emerald-600">{conversionMessage}</span>
            ) : (
              <span className="text-red-600">{conversionMessage}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
