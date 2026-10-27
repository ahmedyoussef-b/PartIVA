'use client';

import { useRef } from 'react';

interface IngestZoneProps {
  photos: string[];
  cadFiles: string[];
  onPhotosChange: (urls: string[]) => void;
  onCadFilesChange: (urls: string[]) => void;
  dimensions: { length?: number; width?: number; height?: number; diameter?: number; unit: 'mm' | 'cm' };
  onDimensionsChange: (dims: any) => void;
  description: string;
  onDescriptionChange: (desc: string) => void;
  mode: 'quick' | 'deep';
  onModeChange: (mode: 'quick' | 'deep') => void;
  onSubmit: () => void;
  loading: boolean;
}

export function IngestZone({
  photos,
  cadFiles,
  onPhotosChange,
  onCadFilesChange,
  dimensions,
  onDimensionsChange,
  description,
  onDescriptionChange,
  mode,
  onModeChange,
  onSubmit,
  loading,
}: IngestZoneProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cadInputRef = useRef<HTMLInputElement>(null);

  async function simulateUpload(files: FileList | null, type: 'photo' | 'cad') {
    if (!files) return;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      if (uploadPreset && cloudName) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        try {
          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          urls.push(data.secure_url ?? URL.createObjectURL(file));
        } catch {
          urls.push(URL.createObjectURL(file));
        }
      } else {
        urls.push(URL.createObjectURL(file));
      }
    }
    if (type === 'photo') {
      onPhotosChange([...photos, ...urls]);
    } else {
      onCadFilesChange([...cadFiles, ...urls]);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <h2 className="text-lg font-semibold">Collecte</h2>
      <div className="space-y-2">
        <input
          ref={photoInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => simulateUpload(e.target.files, 'photo')}
          className="w-full text-sm"
        />
        <input
          ref={cadInputRef}
          type="file"
          multiple
          accept=".stl,.step,.stp,.iges,.igs,.dxf,.dwg,.obj,.3mf"
          onChange={(e) => simulateUpload(e.target.files, 'cad')}
          className="w-full text-sm"
        />
        <div className="text-xs text-muted-foreground">
          Photos: {photos.length} | CAO: {cadFiles.length}
        </div>
        <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Déposer photos ou fichiers CAO (STEP/STL)
        </div>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Longueur"
            value={dimensions.length ?? ''}
            onChange={(e) => onDimensionsChange({ ...dimensions, length: e.target.value ? Number(e.target.value) : undefined })}
            className="rounded border px-2 py-1 text-sm"
            type="number"
          />
          <input
            placeholder="Largeur"
            value={dimensions.width ?? ''}
            onChange={(e) => onDimensionsChange({ ...dimensions, width: e.target.value ? Number(e.target.value) : undefined })}
            className="rounded border px-2 py-1 text-sm"
            type="number"
          />
          <input
            placeholder="Hauteur"
            value={dimensions.height ?? ''}
            onChange={(e) => onDimensionsChange({ ...dimensions, height: e.target.value ? Number(e.target.value) : undefined })}
            className="rounded border px-2 py-1 text-sm"
            type="number"
          />
          <input
            placeholder="Diamètre"
            value={dimensions.diameter ?? ''}
            onChange={(e) => onDimensionsChange({ ...dimensions, diameter: e.target.value ? Number(e.target.value) : undefined })}
            className="rounded border px-2 py-1 text-sm"
            type="number"
          />
        </div>
        <select
          value={dimensions.unit}
          onChange={(e) => onDimensionsChange({ ...dimensions, unit: e.target.value as 'mm' | 'cm' })}
          className="w-full rounded border px-2 py-1 text-sm"
        >
          <option value="mm">mm</option>
          <option value="cm">cm</option>
        </select>
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
          rows={3}
        />
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value as 'quick' | 'deep')}
          className="w-full rounded border px-2 py-1 text-sm"
        >
          <option value="quick">Rapide (quick)</option>
          <option value="deep">Reconstruction (deep)</option>
        </select>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? 'Analyse en cours...' : 'Analyser'}
        </button>
      </div>
    </div>
  );
}
