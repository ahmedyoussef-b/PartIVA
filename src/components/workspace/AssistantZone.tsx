/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
'use client';

import type { EngineResult } from '@/core/ai-engine/engine';

interface AssistantZoneProps {
  result: EngineResult | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

export function AssistantZone({ result, status, error }: AssistantZoneProps) {
  const messages = [];

  if (status === 'loading') {
    messages.push({
      id: 'loading',
      role: 'assistant' as const,
      content: 'Analyse en cours...',
    });
  }

  if (status === 'error' && error) {
    messages.push({
      id: 'error',
      role: 'assistant' as const,
      content: '',
      error,
    });
  }

  if (result) {
    if (result.ingest?.warnings?.length) {
      messages.push({
        id: 'ingest-warnings',
        role: 'assistant' as const,
        content: `Avertissements ingestion:\n${result.ingest.warnings.join('\n')}`,
      });
    }
    messages.push({
      id: 'ingest-status',
      role: 'assistant' as const,
      content: `Ingestion: ${result.ingest?.inputType} / ${result.ingest?.analysisStatus} (${result.ingest?.metadata?.fileCount} fichiers)`,
    });

    if (result.search?.candidates?.length) {
      messages.push({
        id: 'search-candidates',
        role: 'assistant' as const,
        content: `Résultats recherche (${result.search.candidates.length}):\n${result.search.candidates.map((c: any, i: number) => `${i + 1}. ${c.partNumber || c.name || 'Candidat'} (score: ${c.confidence || c.score || 'N/A'})`).join('\n')}`,
      });
    } else {
      messages.push({
        id: 'search-status',
        role: 'assistant' as const,
        content: `Recherche: ${result.search?.searchStatus}`,
      });
    }

    if (result.reconstruct?.reconstructStatus === 'partial') {
      messages.push({
        id: 'reconstruct-warning',
        role: 'assistant' as const,
        content: 'Reconstruction manuelle nécessaire',
      });
    }

    messages.push({
      id: 'reconstruct-status',
      role: 'assistant' as const,
      content: `Reconstruction: ${result.reconstruct?.reconstructStatus}${result.reconstruct?.candidates?.length ? ` (${result.reconstruct.candidates.length} candidats)` : ''}`,
    });

    if (result.archive?.archiveStatus === 'success') {
      messages.push({
        id: 'archive-success',
        role: 'assistant' as const,
        content: 'Pièce archivée',
      });
    } else if (result.archive?.archiveStatus === 'partial') {
      messages.push({
        id: 'archive-draft',
        role: 'assistant' as const,
        content: 'Pièce en draft',
      });
    }

    messages.push({
      id: 'archive-status',
      role: 'assistant' as const,
      content: `Archivage: ${result.archive?.archiveStatus}${result.archive?.archivedPartId ? ` (ID: ${result.archive.archivedPartId})` : ''}`,
    });
  }

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="mb-2 text-lg font-semibold">Assistant IA</h2>
      <div className="flex-1 overflow-auto rounded-lg border p-3 text-sm">
        {messages.length === 0 && <div className="text-muted-foreground">Aucun message pour l'instant</div>}
        {messages.map((m: any) => (
          <div key={m.id} className="mb-2 whitespace-pre-wrap">{m.content}{m.error ? ` (erreur: ${m.error})` : ''}</div>
        ))}
      </div>
    </div>
  );
}


