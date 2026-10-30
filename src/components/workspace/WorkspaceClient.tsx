'use client';

import { useState } from 'react';
import { WorkspaceLayout } from './WorkspaceLayout';
import { IngestZone } from './IngestZone';
import { ViewerZone } from './ViewerZone';
import { AssistantZone } from './AssistantZone';
import type { EngineResult } from '@/core/ai-engine/engine';
import { useWorkspacePersistence } from '@/lib/hooks/use-workspace-persistence';
import { TooltipProvider } from '@/components/ui/tooltip';

export function WorkspaceClient() {
  const {
    state: { photos, cadFiles, dimensions, description, mode, result },
    setPhotos,
    setCadFiles,
    setDimensions,
    setDescription,
    setMode,
    setResult,
    clearWorkspace,
  } = useWorkspacePersistence();

  const [extractedDimensions, setExtractedDimensions] = useState<{
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
  } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  function handleDimensionsExtracted(dims: {
    length: number;
    width: number;
    height: number;
    diameter: number;
  }) {
    setExtractedDimensions(dims);
    setDimensions((prev) => {
      if (
        prev.length === undefined &&
        prev.width === undefined &&
        prev.height === undefined &&
        prev.diameter === undefined
      ) {
        return { ...prev, ...dims };
      }
      return prev;
    });
  }

  async function handleSubmit() {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos,
          cadFiles,
          dimensions,
          description,
          mode,
        }),
      });
      const data = await res.json();
      if (data?.success === false || data?.error) {
        setError(data.error || 'Erreur inconnue');
        setStatus('error');
        return;
      }
      setResult(data as EngineResult);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setStatus('error');
    }
  }

  function handleClearWorkspace() {
    clearWorkspace();
    setExtractedDimensions(null);
    setStatus('idle');
    setError(null);
  }

  return (
    <TooltipProvider>
      <WorkspaceLayout>
        <div className="min-h-0 overflow-y-auto rounded-lg border bg-background">
          <IngestZone
            photos={photos}
            cadFiles={cadFiles}
            onPhotosChange={setPhotos}
            onCadFilesChange={setCadFiles}
            dimensions={dimensions}
            onDimensionsChange={setDimensions}
            extractedDimensions={extractedDimensions}
            description={description}
            onDescriptionChange={setDescription}
            mode={mode}
            onModeChange={setMode}
            onSubmit={handleSubmit}
            loading={status === 'loading'}
            onClearWorkspace={handleClearWorkspace}
          />
        </div>
        <div className="flex min-h-0 flex-col rounded-lg border bg-background">
          <ViewerZone
            fileUrl={result?.reconstruct?.candidates?.[0]?.fileUrl ?? null}
            uploadedFileUrl={cadFiles[0] ?? photos[0] ?? null}
            candidates={result?.reconstruct?.candidates ?? []}
            onDimensionsExtracted={handleDimensionsExtracted}
          />
        </div>
        <div className="flex min-h-0 flex-col rounded-lg border bg-background">
          <AssistantZone result={result} status={status} error={error} />
        </div>
      </WorkspaceLayout>
    </TooltipProvider>
  );
}
