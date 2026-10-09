'use client';

import * as React from 'react';
import { Camera, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

export interface PartImageItem {
  id: string;
  url: string;
  altText: string | null;
  caption: string | null;
  isPrimary: boolean;
}

interface PartImageGalleryProps {
  images: PartImageItem[];
  partName: string;
}

export default function PartImageGallery({ images, partName }: PartImageGalleryProps) {
  const [activeImage, setActiveImage] = React.useState<PartImageItem | null>(null);

  if (images.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucune photo pour cette pièce.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
          <Camera className="text-primary h-4 w-4" />
          Photographies de la pièce
        </span>
        <span className="text-muted-foreground text-xs">
          Cliquez sur une photo pour l&apos;agrandir
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, idx) => (
          <div
            key={image.id}
            onClick={() => setActiveImage(image)}
            className="group bg-background hover:border-primary/60 flex cursor-pointer flex-col overflow-hidden rounded-xl border transition-all hover:shadow-md"
          >
            <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.altText ?? `${partName} - Vue ${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Eye className="h-5 w-5" />
                <span className="text-xs font-semibold">Agrandir la photo</span>
              </div>
              <div className="absolute bottom-2 left-2">
                <Badge
                  variant="secondary"
                  className="bg-black/60 text-[10px] text-white backdrop-blur-xs"
                >
                  {image.isPrimary ? 'Photo principale' : `Vue #${idx + 1}`}
                </Badge>
              </div>
            </div>

            <div className="space-y-1 p-3">
              <p className="text-foreground line-clamp-1 text-xs font-semibold">
                {image.caption ?? image.altText ?? `${partName} - Vue ${idx + 1}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {activeImage && (
        <Dialog open={Boolean(activeImage)} onOpenChange={() => setActiveImage(null)}>
          <DialogContent className="max-w-4xl overflow-hidden border-zinc-800 bg-black/95 p-0 text-white">
            <div className="relative flex aspect-[16/10] w-full items-center justify-center bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage.url}
                alt={activeImage.altText ?? partName}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="space-y-1 border-t border-zinc-800 bg-zinc-950 p-6">
              <DialogTitle className="text-lg font-bold text-white">
                {activeImage.caption ?? activeImage.altText ?? partName}
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-300">
                {activeImage.altText ?? partName}
              </DialogDescription>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
