'use client';

import { CadViewer } from '@/components/3d/cad-viewer';
import { ModelViewer } from '@/components/3d/model-viewer';

interface ViewerZoneProps {
  fileUrl?: string | null;
}

function isCad(url: string) {
  const ext = url.slice(url.lastIndexOf('.')).toLowerCase();
  return ['.step', '.stp', '.iges', '.igs'].includes(ext);
}

export function ViewerZone({ fileUrl }: ViewerZoneProps) {
  if (!fileUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-sm text-muted-foreground">
        <p>Aucun modèle 3D disponible</p>
      </div>
    );
  }

  if (isCad(fileUrl)) {
    return (
      <div className="flex h-full flex-col p-4">
        <CadViewer src={fileUrl} bare height={400} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      <ModelViewer src={fileUrl} bare height={400} />
    </div>
  );
}
