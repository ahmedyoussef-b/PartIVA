'use client';

import { useState } from 'react';
import { WorkspaceLayout } from './WorkspaceLayout';
import { IngestZone } from './IngestZone';
import { ViewerZone } from './ViewerZone';
import { AssistantZone } from './AssistantZone';
import type { EngineResult } from '@/core/ai-engine/engine';

export function WorkspaceClient() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [cadFiles, setCadFiles] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState<{
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    unit: 'mm' | 'cm';
  }>({ unit: 'mm' });
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'quick' | 'deep'>('quick');
  const [result, setResult] = useState<EngineResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

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

  return (
    <WorkspaceLayout>
      <div className="overflow-auto rounded-lg border bg-background">
        <IngestZone
          photos={photos}
          cadFiles={cadFiles}
          onPhotosChange={setPhotos}
          onCadFilesChange={setCadFiles}
          dimensions={dimensions}
          onDimensionsChange={setDimensions}
          description={description}
          onDescriptionChange={setDescription}
          mode={mode}
          onModeChange={setMode}
          onSubmit={handleSubmit}
          loading={status === 'loading'}
        />
      </div>
      <div className="overflow-auto rounded-lg border bg-background">
        <ViewerZone fileUrl={result?.reconstruct?.candidates?.[0]?.fileUrl ?? null} uploadedFileUrl={cadFiles[0] ?? null} />
      </div>
      <div className="overflow-auto rounded-lg border bg-background">
        <AssistantZone result={result} status={status} error={error} />
      </div>
    </WorkspaceLayout>
  );
}
