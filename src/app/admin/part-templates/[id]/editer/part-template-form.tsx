'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { updatePartTemplate } from '@/lib/actions/part-templates';
import type { PartTemplate } from '@/generated/prisma/client';

interface PartTemplateFormProps {
  initialTemplate: PartTemplate;
}

export function PartTemplateForm({ initialTemplate }: PartTemplateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: initialTemplate.name,
    description: initialTemplate.description ?? '',
    categoryId: initialTemplate.categoryId ?? '',
    material: initialTemplate.material ?? '',
    sourceMethod: initialTemplate.sourceMethod ?? '',
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updatePartTemplate({
        id: initialTemplate.id,
        name: formData.name,
        description: formData.description || undefined,
        material: formData.material || undefined,
        categoryId: formData.categoryId || undefined,
        sourceMethod:
          (formData.sourceMethod as 'CATALOG' | 'WORKSPACE' | 'REVERSE' | 'IMPORT') || undefined,
      });

      if (result.success) {
        toast.success('Template mis à jour avec succès');
        router.push(`/admin/part-templates/${initialTemplate.id}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
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
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              name="name"
              required
              minLength={3}
              maxLength={200}
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
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Catégorie</Label>
            <Input
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Matière</Label>
            <Input
              id="material"
              name="material"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceMethod">Méthode source</Label>
            <Input
              id="sourceMethod"
              name="sourceMethod"
              value={formData.sourceMethod}
              onChange={(e) => setFormData({ ...formData, sourceMethod: e.target.value })}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
