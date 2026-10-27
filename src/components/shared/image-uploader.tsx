'use client';

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  tag: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxFiles?: number;
  maxSize?: number; // en bytes
  label?: string;
  description?: string;
}

const ACCEPTED_FORMATS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const PHOTO_TAGS = [
  "Vue d'ensemble",
  'Vue de face',
  'Vue de profil',
  'Vue de dessus',
  'Détail / Macro',
  'Autre',
];

export function ImageUploader({
  images,
  onImagesChange,
  maxFiles = 10,
  maxSize = 15 * 1024 * 1024, // 15 MB
  label = 'Photographies',
  description = 'Glissez-déposez vos photos ici, ou parcourez vos fichiers',
}: ImageUploaderProps) {
  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const newImages: UploadedImage[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        tag: 'Vue d&apos;ensemble',
      }));
      onImagesChange([...images, ...newImages]);
    },
    [images, onImagesChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: ACCEPTED_FORMATS,
  });

  const removeImage = React.useCallback(
    (id: string) => {
      const image = images.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      onImagesChange(images.filter((img) => img.id !== id));
    },
    [images, onImagesChange],
  );

  const updateTag = React.useCallback(
    (id: string, newTag: string) => {
      onImagesChange(images.map((img) => (img.id === id ? { ...img, tag: newTag } : img)));
    },
    [images, onImagesChange],
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 font-heading text-lg font-semibold text-tech-navy">{label}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Zone de drop */}
      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          isDragActive
            ? 'border-tech-primary bg-tech-primary/5'
            : 'border-border hover:border-tech-primary/50',
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="mb-1 text-sm font-medium text-foreground">
          {isDragActive
            ? 'Déposez les fichiers ici...'
            : 'Glissez-déposez vos photos ici, ou parcourez vos fichiers'}
        </p>
        <p className="text-xs text-muted-foreground">
          Formats JPG, PNG, WEBP acceptés jusqu&agrave; 15 Mo par image
        </p>
      </div>

      {/* Previews */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">
            {images.length} photo(s) chargée(s)
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-lg border bg-card"
              >
                <Image
                  src={image.preview}
                  alt={image.tag || 'Photo de la pièce'}
                  width={400}
                  height={192}
                  unoptimized
                  className="h-48 w-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="space-y-2 p-3">
                  <p className="truncate text-xs font-medium">{image.file.name}</p>
                  <select
                    value={image.tag}
                    onChange={(e) => updateTag(image.id, e.target.value)}
                    className="w-full rounded border bg-background px-2 py-1 text-xs"
                  >
                    {PHOTO_TAGS.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {(image.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
