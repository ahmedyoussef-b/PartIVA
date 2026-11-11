'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { createPartTemplate } from '@/lib/actions/part-templates';

const SOURCE_METHODS = ['CATALOG', 'WORKSPACE', 'REVERSE', 'IMPORT'] as const;

export default function NewPartTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    material: '',
    sourceMethod: '',
    printableModelUrl: '',
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createPartTemplate({
        name: formData.name,
        description: formData.description || undefined,
        categoryId: formData.categoryId || undefined,
        material: formData.material || undefined,
        sourceMethod: (formData.sourceMethod || undefined) as
          'CATALOG' | 'WORKSPACE' | 'REVERSE' | 'IMPORT' | undefined,
        printableModelUrl: formData.printableModelUrl || undefined,
      });
      if (result.success) {
        toast.success('Template créé avec succès');
        router.push('/admin/part-templates');
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
    <div className="max-w-7xl space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Nouveau template</h1>
      </div>
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
                placeholder="Description du template"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material">Matière</Label>
              <Input
                id="material"
                name="material"
                maxLength={100}
                placeholder="Ex. Acier inox 304 — optionnel"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Catégorie (CUID)</Label>
              <Input
                id="categoryId"
                name="categoryId"
                placeholder="CUID de la catégorie — optionnel"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceMethod">Méthode source</Label>
              <select
                id="sourceMethod"
                name="sourceMethod"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={formData.sourceMethod}
                onChange={(e) => setFormData({ ...formData, sourceMethod: e.target.value })}
              >
                <option value="">— Aucune —</option>
                {SOURCE_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="printableModelUrl">Modèle CAO (URL)</Label>
              <Input
                id="printableModelUrl"
                name="printableModelUrl"
                type="url"
                placeholder="https://… — optionnel"
                value={formData.printableModelUrl}
                onChange={(e) => setFormData({ ...formData, printableModelUrl: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création…' : 'Créer le template'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
