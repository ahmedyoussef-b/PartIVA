'use client';

import { useState } from 'react';
import { Ruler } from 'lucide-react';
import { CadViewer } from '@/components/3d/cad-viewer';
import { ModelViewer } from '@/components/3d/model-viewer';

interface ViewerZoneProps {
  fileUrl?: string | null;
  uploadedFileUrl?: string | null;
}

function isCad(url: string) {
  const ext = url.slice(url.lastIndexOf('.')).toLowerCase();
  return ['.step', '.stp', '.iges', '.igs'].includes(ext);
}

export function ViewerZone({ fileUrl, uploadedFileUrl }: ViewerZoneProps) {
  const displayUrl = fileUrl || uploadedFileUrl || null;
  const [measuring, setMeasuring] = useState(false);
  if (!displayUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border bg-white p-4 text-center text-sm text-gray-500 shadow-sm">
        <svg
          className="h-10 w-10 text-gray-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <p>Aucun modèle 3D chargé. Déposez un fichier STEP ou STL pour commencer.</p>
      </div>
    );
  }

  const isCadFile = isCad(displayUrl);

  return (
    <div className="relative flex h-full flex-col">
      <button
        type="button"
        onClick={() => setMeasuring((v) => !v)}
        className={`absolute top-2 right-2 z-10 rounded-md border px-2 py-1 text-xs ${
          measuring ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
        }`}
      >
        <Ruler className="h-4 w-4" />
      </button>
      {isCadFile ? (
        <CadViewer src={displayUrl} bare height={400} measureEnabled={measuring} />
      ) : (
        <ModelViewer src={displayUrl} bare height={400} measureEnabled={measuring} />
      )}
    </div>
  );
}
