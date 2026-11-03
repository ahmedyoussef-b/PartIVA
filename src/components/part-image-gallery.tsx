'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Plus,
  Loader2,
  Trash2,
  Maximize2,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { addPartImage, deletePartImage } from '@/lib/actions/parts';

interface GalleryImage {
  id: string;
  url: string;
  altText?: string | null;
  caption?: string | null;
  order?: number;
}

interface PartImageGalleryProps {
  images: GalleryImage[];
  primaryImage?: string | null;
  className?: string;
  partName?: string;
  partId?: string;
}

export default function PartImageGallery({
  images,
  primaryImage,
  partName,
  className,
  partId,
}: PartImageGalleryProps) {
  const router = useRouter();
  const params = useParams();
  const effectivePartId = partId || (params?.id as string);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Gestion des images ajoutées ou supprimées localement pour réactivité instantanée
  const [addedImages, setAddedImages] = useState<GalleryImage[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Liste active des images affichées
  const displayImages: GalleryImage[] = [
    ...images.filter((img) => !deletedIds.includes(img.id)),
    ...addedImages.filter(
      (a) => !deletedIds.includes(a.id) && !images.some((img) => img.id === a.id),
    ),
  ];

  // Navigation clavier pour la lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : displayImages.length - 1,
        );
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev !== null && prev < displayImages.length - 1 ? prev + 1 : 0,
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, displayImages.length]);

  const handleAddClick = () => {
    console.log('[ADMIN-IMAGE-UPLOAD] Ajout demandé');
    fileInputRef.current?.click();
  };

  const handleOpenWorkspace = () => {
    if (!effectivePartId) {
      toast.error('Identifiant de la pièce manquant pour ouvrir le workspace');
      return;
    }
    router.push(`/workspace?partId=${effectivePartId}`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log(`[ADMIN-IMAGE-UPLOAD] Upload: { fileName, status }`, {
      fileName: file.name,
      status: 'uploading',
    });

    if (!effectivePartId) {
      toast.error('Identifiant de la pièce manquant');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('partId', effectivePartId);

      const res = await addPartImage(formData);

      if (res.success) {
        console.log(`[ADMIN-IMAGE-UPLOAD] ✅ Image ajoutée:`, file.name);
        toast.success('Image ajoutée avec succès');
        if (res.image) {
          setAddedImages((prev) => [...prev, res.image]);
        }
        router.refresh();
      } else {
        console.error('[ADMIN-IMAGE-UPLOAD-ERROR] Erreur serveur:', res.error);
        toast.error(res.error || "Erreur lors de l'upload");
      }
    } catch (err) {
      console.error('[ADMIN-IMAGE-UPLOAD-ERROR] Exception:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteClick = async (imageId: string) => {
    if (!effectivePartId) {
      toast.error('Identifiant de la pièce manquant');
      return;
    }

    const confirmDelete = window.confirm('Êtes-vous sûr de vouloir supprimer cette image ?');
    if (!confirmDelete) return;

    console.log('[ADMIN-IMAGE-DELETE] Suppression demandée: { partId, imageId }', {
      partId: effectivePartId,
      imageId,
    });

    setDeletingId(imageId);
    try {
      const res = await deletePartImage({
        partId: effectivePartId,
        imageId,
      });

      if (res.success) {
        console.log('[ADMIN-IMAGE-DELETE] ✅ Image supprimée:', {
          partId: effectivePartId,
          imageId,
        });
        toast.success('Image supprimée');
        setDeletedIds((prev) => [...prev, imageId]);
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
        }
        router.refresh();
      } else {
        console.error('[ADMIN-IMAGE-DELETE-ERROR] Erreur:', res.error);
        toast.error(res.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('[ADMIN-IMAGE-DELETE-ERROR] Exception:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setDeletingId(null);
    }
  };

  const hasImages = displayImages.length > 0;
  const activeLightboxImage = lightboxIndex !== null ? displayImages[lightboxIndex] : null;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-medium">
            {partName ? `${partName} — ` : ''}Images ({displayImages.length})
          </CardTitle>
          <CardDescription>Galerie des photos de la pièce</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {effectivePartId && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-3"
              onClick={handleOpenWorkspace}
              title="Ouvrir dans le workspace"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Workspace
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            onClick={handleAddClick}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="mr-1 h-3.5 w-3.5" />
            )}
            {uploading ? 'Ajout...' : 'Ajouter'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </CardHeader>
      <CardContent>
        {!hasImages ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-muted/50">
            <p className="text-sm text-muted-foreground">Aucune image téléchargée</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddClick}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-3.5 w-3.5" />
              )}
              {uploading ? 'Ajout en cours...' : 'Ajouter une photo'}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {displayImages.map((img, idx) => (
                <div
                  key={img.id}
                  className={`group relative aspect-video cursor-pointer overflow-hidden rounded-md border-2 transition-shadow ${
                    primaryImage === img.url
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => setLightboxIndex(idx)}
                >
                  <Image
                    src={img.url}
                    alt={img.altText || img.caption || `Image ${idx + 1}`}
                    fill
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      console.error(`[DEBUG-GALLERY] Erreur chargement image:`, img.url);
                      (e.target as HTMLImageElement).src = '/placeholder-image.png';
                    }}
                  />

                  {/* Overlay au survol avec actions Agrandir et Supprimer */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 gap-1 bg-white/90 text-xs text-foreground hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(idx);
                      }}
                      title="Agrandir l'image"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      Agrandir
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      disabled={deletingId === img.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(img.id);
                      }}
                      title="Supprimer l'image"
                    >
                      {deletingId === img.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Supprimer
                    </Button>
                  </div>

                  <Badge
                    variant="secondary"
                    className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-white"
                  >
                    {img.caption || `Image ${idx + 1}`}
                  </Badge>
                </div>
              ))}
            </div>

            {displayImages.length > 4 && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{displayImages.length}</span> photos au total
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Lightbox plein écran */}
      {activeLightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Bouton Fermer */}
          <button
            type="button"
            className="absolute top-4 right-4 z-50 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/40 focus:outline-none"
            onClick={() => setLightboxIndex(null)}
            aria-label="Fermer la vue agrandie"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Bouton Précédent */}
          {displayImages.length > 1 && (
            <button
              type="button"
              className="absolute left-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/40 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev !== null && prev > 0 ? prev - 1 : displayImages.length - 1,
                );
              }}
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Contenu Lightbox */}
          <div
            className="relative flex max-h-[85vh] max-w-[85vw] flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[70vh] w-[80vw] max-w-4xl">
              <Image
                src={activeLightboxImage.url}
                alt={activeLightboxImage.altText || 'Vue agrandie'}
                fill
                unoptimized
                className="rounded object-contain"
              />
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm text-white/90">
              <span>
                {activeLightboxImage.caption ||
                  activeLightboxImage.altText ||
                  `Image ${lightboxIndex! + 1}`}
              </span>
              <span className="text-xs text-white/50">
                ({lightboxIndex! + 1} / {displayImages.length})
              </span>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => handleDeleteClick(activeLightboxImage.id)}
              >
                <Trash2 className="h-3 w-3" />
                Supprimer
              </Button>
            </div>
          </div>

          {/* Bouton Suivant */}
          {displayImages.length > 1 && (
            <button
              type="button"
              className="absolute right-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/40 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev !== null && prev < displayImages.length - 1 ? prev + 1 : 0,
                );
              }}
              aria-label="Image suivante"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
