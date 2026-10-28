'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, Plus } from 'lucide-react';
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

  const canConvert = isAdmin && Boolean(candidate.fileUrl);

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
        {canConvert && (
          <button
            type="button"
            onClick={handleConvert}
            disabled={isConverting}
            className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
