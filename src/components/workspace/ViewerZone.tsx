'use client';

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
  const displayUrl = fileUrl ?? uploadedFileUrl ?? null;
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

  if (isCad(displayUrl)) {
    return (
      <div className="flex h-full flex-col p-4">
        <CadViewer src={displayUrl} bare height={400} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      <ModelViewer src={displayUrl} bare height={400} />
    </div>
  );
}
