'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { updatePartTemplate, deletePartTemplate } from '@/lib/actions/part-templates';

interface EditTemplateFormProps {
  initialTemplate: {
    id: string;
    name: string;
    description: string | null;
    material: string | null;
    categoryId: string | null;
    sourceMethod: string | null;
    printableModelUrl: string | null;
  };
}

export function EditTemplateForm({ initialTemplate }: EditTemplateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const result = await updatePartTemplate({
      id: initialTemplate.id,
      name: (formData.get('name') as string) || initialTemplate.name,
      description: (formData.get('description') as string) || undefined,
      categoryId: (formData.get('categoryId') as string) || undefined,
      material: (formData.get('material') as string) || undefined,
      sourceMethod: ((formData.get('sourceMethod') as string) || undefined) as
        'CATALOG' | 'WORKSPACE' | 'REVERSE' | 'IMPORT' | undefined,
      printableModelUrl: (formData.get('printableModelUrl') as string) || undefined,
    });

    setLoading(false);
    if (result.success) {
      toast.success('Template mis à jour');
      router.push(`/admin/part-templates/${initialTemplate.id}`);
      router.refresh();
    } else {
      toast.error(result.error || 'Erreur lors de la mise à jour');
    }
  }

  async function handleDelete() {
    if (!window.confirm('Confirmer la suppression ?')) {
      return;
    }
    setLoading(true);
    const result = await deletePartTemplate(initialTemplate.id);
    setLoading(false);
    if (result.success) {
      toast.success('Template supprimé');
      router.push('/admin/part-templates');
      router.refresh();
    } else {
      toast.error(result.error || 'Erreur lors de la suppression');
    }
  }

  return (
    <Card className="max-w-2xl">
      <form onSubmit={handleUpdate}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" required defaultValue={initialTemplate.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={initialTemplate.description ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="material">Matière</Label>
            <Input id="material" name="material" defaultValue={initialTemplate.material ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Catégorie</Label>
            <Input
              id="categoryId"
              name="categoryId"
              defaultValue={initialTemplate.categoryId ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sourceMethod">Méthode source</Label>
            <Input
              id="sourceMethod"
              name="sourceMethod"
              defaultValue={initialTemplate.sourceMethod ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="printableModelUrl">Modèle CAO (URL)</Label>
            <Input
              id="printableModelUrl"
              name="printableModelUrl"
              type="url"
              defaultValue={initialTemplate.printableModelUrl ?? ''}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link href="/admin/part-templates" className="inline-block">
            <Button variant="outline">Annuler</Button>
          </Link>
          <Button variant="destructive" type="button" onClick={handleDelete} disabled={loading}>
            {loading ? 'Suppression…' : 'Supprimer'}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
