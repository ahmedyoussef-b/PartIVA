/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
'use client';

import { useEffect, useRef } from 'react';
import { Trash2, X } from 'lucide-react';
import { FileUploadZone } from './FileUploadZone';

interface IngestZoneProps {
  photos: string[];
  cadFiles: string[];
  onPhotosChange: (urls: string[]) => void;
  onCadFilesChange: (urls: string[]) => void;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    unit: 'mm' | 'cm';
  };
  onDimensionsChange: (dims: any) => void;
  extractedDimensions?: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
  } | null;
  description: string;
  onDescriptionChange: (desc: string) => void;
  mode: 'quick' | 'deep';
  onModeChange: (mode: 'quick' | 'deep') => void;
  onSubmit: () => void;
  loading: boolean;
  onClearWorkspace: () => void;
}

export function IngestZone({
  photos,
  cadFiles,
  onPhotosChange,
  onCadFilesChange,
  dimensions,
  onDimensionsChange,
  extractedDimensions,
  description,
  onDescriptionChange,
  mode,
  onModeChange,
  onSubmit,
  loading,
  onClearWorkspace,
}: IngestZoneProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!extractedDimensions) return;
    onDimensionsChange({
      ...dimensions,
      length: dimensions.length ?? extractedDimensions.length,
      width: dimensions.width ?? extractedDimensions.width,
      height: dimensions.height ?? extractedDimensions.height,
      diameter: dimensions.diameter ?? extractedDimensions.diameter,
    });
  }, [extractedDimensions]);

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
    <div className="flex h-full flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Collecte</h2>
        <button
          type="button"
          onClick={onClearWorkspace}
          className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 hover:text-red-600"
          title="Effacer le workspace"
        >
          <Trash2 className="h-3 w-3" />
          Effacer
        </button>
        <span className="ml-auto text-[10px] text-gray-400">Sauvegardé localement</span>
      </div>
      <input
        ref={photoInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => simulateUpload(e.target.files, 'photo')}
        className="hidden"
      />
      <FileUploadZone
        accept=".stl,.step,.stp,.iges,.igs,.dxf,.dwg,.obj,.3mf"
        onFiles={(files) => simulateUpload(files, 'cad')}
        label="Déposez vos fichiers CAO ici ou cliquez pour parcourir"
        hint="STL, STEP, IGES, OBJ, 3MF"
      />
      <button
        type="button"
        onClick={() => photoInputRef.current?.click()}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        Ajouter des photos
      </button>
      <div className="text-xs text-gray-500">
        Photos: {photos.length} | CAO: {cadFiles.length}
      </div>
      {cadFiles.length > 0 && (
        <ul className="space-y-1 text-xs text-gray-600">
          {cadFiles.map((url, i) => (
            <li key={i} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1">
              <span className="truncate">{url.split('/').pop()}</span>
              <button
                type="button"
                onClick={() => onCadFilesChange(cadFiles.filter((_, idx) => idx !== i))}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Longueur (mm)"
            value={dimensions.length ?? ''}
            onChange={(e) =>
              onDimensionsChange({
                ...dimensions,
                length: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            type="number"
          />
          <input
            placeholder="Largeur (mm)"
            value={dimensions.width ?? ''}
            onChange={(e) =>
              onDimensionsChange({
                ...dimensions,
                width: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            type="number"
          />
          <input
            placeholder="Hauteur (mm)"
            value={dimensions.height ?? ''}
            onChange={(e) =>
              onDimensionsChange({
                ...dimensions,
                height: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            type="number"
          />
          <input
            placeholder="Diamètre (mm)"
            value={dimensions.diameter ?? ''}
            onChange={(e) =>
              onDimensionsChange({
                ...dimensions,
                diameter: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            type="number"
          />
        </div>
        <select
          value={dimensions.unit}
          onChange={(e) =>
            onDimensionsChange({ ...dimensions, unit: e.target.value as 'mm' | 'cm' })
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
        >
          <option value="mm">mm</option>
          <option value="cm">cm</option>
        </select>
        <textarea
          placeholder="Description de la pièce..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          rows={3}
        />
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value as 'quick' | 'deep')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
        >
          <option value="quick">Rapide (quick)</option>
          <option value="deep">Reconstruction (deep)</option>
        </select>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Analyse en cours...' : 'Analyser'}
        </button>
      </div>
    </div>
  );
}
