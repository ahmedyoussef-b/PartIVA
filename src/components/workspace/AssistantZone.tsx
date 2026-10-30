/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { availableProviders } from '@/lib/ai/providers';
import { useSession } from '@/lib/auth-client';
import type { EngineResult } from '@/core/ai-engine/engine';
import { ChatInput } from './ChatInput';
import { CandidateCard } from './CandidateCard';
import { generateSuggestions } from '@/lib/ai/suggestions';
import { Download, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { exportWorkspaceToPdf } from '@/lib/export/pdf-export';
import { recommendMaterial } from '@/lib/ai/material-recommendation';
import { SuggestionList } from './SuggestionList';
import type { SearchCandidate } from '@/core/ai-engine/skills/search/types';

interface AssistantZoneProps {
  result: EngineResult | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

export function AssistantZone({ result, status, error }: AssistantZoneProps) {
  const messages = [];
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [providerId, setProviderId] = useState('groq');
  async function handleExportPdf() {
    if (!result) return;
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    const dataUrl = canvas ? canvas.toDataURL('image/png') : undefined;
    exportWorkspaceToPdf(result, dataUrl);
  }
  const [fiche, setFiche] = useState<string | null>(null);
  const [ficheLoading, setFicheLoading] = useState(false);
  const materialRecs = result ? recommendMaterial(result.ingest) : [];
  const suggestions = result ? generateSuggestions(result) : [];
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === 'ADMIN';

  async function handleSend(message: string) {
    setChatMessages((prev) => [...prev, { role: 'user', content: message }]);
    setIsStreaming(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, providerId, context: result }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply ?? '' }]);
    } finally {
      setIsStreaming(false);
    }
  }

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
        content: `Résultats recherche (${result.search.candidates.length})`,
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

  async function handleGenerateFiche() {
    if (!result) return;
    setFicheLoading(true);
    setFiche(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `À partir des données d'analyse suivantes, génère une fiche technique descriptive de la pièce (5-10 lignes) : matériau probable, usage, points de vigilance pour l'impression 3D, et suggestions de vérification.\n\nContexte : ${JSON.stringify(result)}`,
          providerId,
        }),
      });
      const data = await res.json();
      setFiche(data.reply ?? '');
    } finally {
      setFicheLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold">Assistant IA</h2>
      <div className="mb-2 flex items-center gap-2">
        <select
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className="rounded border px-2 py-1 text-xs"
        >
          {availableProviders.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.tier === 'free' ? 'Gratuit' : 'Payant'})
            </option>
          ))}
        </select>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={!result}
              onClick={handleExportPdf}
              className="flex items-center gap-1 rounded border px-2 py-1 text-xs shadow disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Exporter en PDF
            </button>
          </TooltipTrigger>
          <TooltipContent>Génère un rapport PDF des résultats.</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={!result || ficheLoading}
              onClick={handleGenerateFiche}
              className="flex items-center gap-1 rounded border px-2 py-1 text-xs shadow disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              {ficheLoading ? 'Génération...' : 'Fiche technique'}
            </button>
          </TooltipTrigger>
          <TooltipContent>Génère une fiche technique descriptive via l'IA.</TooltipContent>
        </Tooltip>
      </div>
      {fiche && (
        <div className="mb-2 rounded border bg-blue-50 p-2 text-xs whitespace-pre-wrap">
          {fiche}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-gray-50 p-3 text-sm">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-400">
            Posez une question à l'IA ou déposez un fichier pour lancer une analyse.
          </div>
        )}
        {messages.map((m: any) => (
          <div key={m.id} className="mb-2 whitespace-pre-wrap">
            {m.content}
            {m.error ? ` (erreur: ${m.error})` : ''}
          </div>
        ))}
        {result?.search?.candidates?.length ? (
          <div className="mt-2 space-y-2">
            <SuggestionList suggestions={suggestions} />
            {materialRecs.length > 0 && (
              <div className="rounded border bg-emerald-50 p-2 text-xs">
                <p className="font-semibold text-emerald-800">Matériaux recommandés</p>
                <ul className="mt-1 space-y-1">
                  {materialRecs.map((m) => (
                    <li key={m.name} className="text-emerald-900">
                      {m.name} — {m.reason} ({Math.round(m.confidence * 100)}%)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.search.candidates.map((c: SearchCandidate) => (
              <CandidateCard key={c.id} candidate={c} isAdmin={isAdmin} />
            ))}
          </div>
        ) : null}
        {chatMessages.map((m, i) => (
          <div key={i} className="mb-2 whitespace-pre-wrap">
            {m.content}
          </div>
        ))}
        <ChatInput onSend={handleSend} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
