'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WorkspaceLayout } from './WorkspaceLayout';
import { IngestZone } from './IngestZone';
import { ViewerZone } from './ViewerZone';
import { AssistantZone } from './AssistantZone';
import type { EngineResult } from '@/core/ai-engine/engine';
import { useWorkspacePersistence } from '@/lib/hooks/use-workspace-persistence';
import { TooltipProvider } from '@/components/ui/tooltip';

interface WorkspaceClientProps {
  isSequential?: boolean;
}

export function WorkspaceClient({ isSequential = false }: WorkspaceClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestId = searchParams.get('requestId');
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

  // Pré-chargement depuis une demande client
  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/requests/${requestId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data.photos) && data.photos.length > 0) {
          setPhotos(data.photos as string[]);
        }
        if (typeof data.partDescription === 'string' && data.partDescription.length > 0) {
          setDescription(data.partDescription);
        }
        if (typeof data.suspectedMaterial === 'string' && data.suspectedMaterial.length > 0) {
          setDimensions((prev) => ({ ...prev, material: data.suspectedMaterial as string }));
        }
      } catch (e) {
        console.error('[workspace] Erreur pré-chargement demande', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId, setPhotos, setDescription, setDimensions]);

  const [extractedDimensions, setExtractedDimensions] = useState<{
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
  } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);

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

  async function handleValidate() {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/engine/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          result,
          action: 'validate',
        }),
      });
      if (!res.ok) throw new Error('Erreur de validation');
      setStatus('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setStatus('error');
    }
  }

  async function handleInvalidate() {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/engine/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          result,
          action: 'invalidate',
        }),
      });
      if (!res.ok) throw new Error("Erreur d'invalidation");
      if (requestId) {
        router.push(`/admin/demandes/${requestId}/reverse-engineering`);
      }
      setStatus('success');
    } catch (e) {
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
      <WorkspaceLayout
        collecte={
          <div className="min-h-0 overflow-y-auto rounded-lg border bg-background">
            {isSequential && requestId && (
              <div className="m-3 mb-0 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-600">
                      Étape 2/4 — Méthode 2 : Workspace IA
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Analysez les photos. Si la reconstruction échoue, passez à la méthode
                      suivante.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/reverse-engineering/${requestId}?sequential=1`}>
                      Passer à la Méthode 3 →
                    </Link>
                  </Button>
                </div>
              </div>
            )}
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
              selectedPhotoIndex={selectedPhotoIndex}
              onSelectPhoto={setSelectedPhotoIndex}
            />
          </div>
        }
        viewport={
          <div className="flex min-h-0 flex-col rounded-lg border bg-background">
            <ViewerZone
              fileUrl={result?.reconstruct?.candidates?.[0]?.fileUrl ?? null}
              uploadedFileUrl={cadFiles[0] ?? photos[selectedPhotoIndex ?? 0] ?? null}
              candidates={result?.reconstruct?.candidates ?? []}
              onDimensionsExtracted={handleDimensionsExtracted}
              photos={photos}
              selectedPhotoIndex={selectedPhotoIndex}
            />
          </div>
        }
        assistant={
          <div className="flex min-h-0 flex-col rounded-lg border bg-background">
            <AssistantZone
              result={result}
              status={status}
              error={error}
              onValidate={handleValidate}
              onInvalidate={handleInvalidate}
            />
          </div>
        }
      />
    </TooltipProvider>
  );
}
