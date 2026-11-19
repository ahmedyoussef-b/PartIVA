'use client';

import { useCallback, useMemo, useState } from 'react';
import GlbViewer, { type GlbSource } from '@/components/pcb/GlbViewer';

interface GlbViewerZoneProps {
  cadFileUrl?: string | null;
}

interface GlbStatus {
  sourceIndex: number;
  status: 'loaded' | 'error';
  error?: string;
}

export function GlbViewerZone({ cadFileUrl }: GlbViewerZoneProps) {
  const [lastStatus, setLastStatus] = useState<GlbStatus | null>(null);

  const sources = useMemo<GlbSource[]>(() => {
    const list: GlbSource[] = [];
    // Niveau 1 — ordre de priorité (essayés séquentiellement par GlbViewer) :
    // (d) upload GLB fourni → source url, prioritaire si présent.
    if (cadFileUrl && /\.glb(?:$|[?#])/i.test(cadFileUrl)) {
      list.push({ type: 'url', url: cadFileUrl });
    }
    // (a) source statique .glb (cube-test.glb) → fallback minimal, toujours
    //     présente pour garantir un modèle affichable même sans upload.
    // (b) pipeline OCCT→GLB (exportGlb) : serveur (child_process), pas de buffer
    //     exploitable côté navigateur → omise (D2.c-bis : source (c) exclue).
    list.push({ type: 'url', url: '/models/cube-test.glb' });
    return list;
  }, [cadFileUrl]);

  const handleStatusChange = useCallback((status: GlbStatus) => {
    setLastStatus(status);
    console.log(
      `[GLB:zone] source=${status.sourceIndex} status=${status.status}${status.error ? ` error=${status.error}` : ''}`,
    );
  }, []);

  return (
    <div className="flex h-full flex-col" data-testid="glb-viewer-zone">
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
        <span>Mode GLB</span>
        {lastStatus ? (
          <span data-testid="glb-viewer-status">
            source={lastStatus.sourceIndex} · {lastStatus.status}
          </span>
        ) : (
          <span data-testid="glb-viewer-status">en attente</span>
        )}
      </div>
      <GlbViewer
        sources={sources}
        fallback={<div data-testid="glb-viewer-fallback">Modèle GLB indisponible</div>}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
