'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ImageUploader } from '@/components/shared/image-uploader';
import { createPart } from '@/lib/actions/parts';

type UploadedImage = {
  id: string;
  file: File;
  preview: string;
  tag: string;
};

export function PiecesForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);

  const [formData, setFormData] = useState({
    partNumber: '',
    name: '',
    description: '',
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData();
    form.append('partNumber', formData.partNumber);
    form.append('name', formData.name);
    form.append('description', formData.description);

    // Ajout des images
    images.forEach((image) => {
      form.append('images', image.file);
      form.append('imageTags', image.tag);
    });

    try {
      const result = await createPart(form);

      if (result.success) {
        toast.success('Pièce créée avec succès');
        router.push('/admin/pieces');
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur lors de la création');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="partNumber">Numéro de pièce</Label>
            <Input
              id="partNumber"
              name="partNumber"
              required
              maxLength={100}
              placeholder="Ex. BR-2026-001"
              value={formData.partNumber}
              onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              name="name"
              required
              minLength={3}
              maxLength={200}
              placeholder="Ex. Bride de serrage"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              maxLength={1000}
              placeholder="Description de la pièce, matière attendue, usage…"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Upload d'images */}
          <ImageUploader
            images={images}
            onImagesChange={setImages}
            label="Photographies de la pièce"
            description="Ajoutez des photos de la pièce (face, profil, détail, etc.)"
          />
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading || images.length === 0}>
            {loading ? 'Création…' : 'Créer la pièce'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
