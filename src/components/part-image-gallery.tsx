'use client';

import React from 'react';
import { Plus, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PartImageGalleryProps {
  images: {
    id: string;
    url: string;
    altText?: string | null;
    caption?: string | null;
    order?: number;
  }[];
  primaryImage?: string | null;
  className?: string;
  partName?: string;
}

export default function PartImageGallery({
  images,
  primaryImage,
  partName,
  className,
}: PartImageGalleryProps) {
  const hasImages = images.length > 0;

  if (!hasImages) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Images ({images.length})</CardTitle>
          <CardDescription>Aucune image disponible pour cette pièce.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 flex h-40 items-center justify-center rounded-md border border-dashed border-gray-300">
            <p className="text-muted-foreground text-sm">Aucune image téléchargée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-medium">
            {partName || `Images (${images.length})`}
          </CardTitle>
          <CardDescription>Galerie des photos de la pièce</CardDescription>
        </div>
        <div className="flex gap-1">
          {images.map((img, idx) => (
            <Button
              key={img.id}
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${
                primaryImage === img.url ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
              title={`Sélectionner comme image principale (${idx + 1})`}
            >
              <Move className="h-3.5 w-3.5" />
            </Button>
          ))}
          <Button variant="outline" size="sm" className="h-8 px-3">
            <Plus className="mr-1 h-3.5 w-3.5" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative aspect-video overflow-hidden rounded-md border-2 transition-shadow ${
                primaryImage === img.url
                  ? 'border-primary ring-primary/20 ring-2'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText || img.caption || `Image ${img.order ? img.order + 1 : '1'}`}
                fill
                className="h-full w-full object-cover"
                onError={(e) => {
                  console.error(`[DEBUG-GALLERY] Erreur chargement image:`, img.url);
                  (e.target as HTMLImageElement).src = '/placeholder-image.png';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-background/80 text-foreground hover:bg-background"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Badge
                variant="secondary"
                className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-white"
              >
                {img.caption || `Image ${img.order ? img.order + 1 : '1'}`}
              </Badge>
            </div>
          ))}
        </div>
        {images.length > 4 && (
          <div className="text-muted-foreground mt-3 flex items-center justify-center gap-2 text-xs">
            <span className="font-medium">{images.length}</span> photos au total
            <button
              className="hover:text-foreground underline underline-offset-2"
              onClick={() =>
                document.getElementById('gallery-full')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Tout afficher
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
