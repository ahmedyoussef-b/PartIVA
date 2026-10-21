'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export function PiecesForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    // Les champs vides sont envoyés comme `undefined` et non comme "" (cf.
    // part-transition-dialog.tsx:63) — sinon la description est stockée vide.
    const data: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      const trimmed = typeof value === 'string' ? value.trim() : value;
      if (typeof trimmed === 'string' && trimmed.length > 0) {
        data[key] = trimmed;
      }
    }

    try {
      const res = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // La réponse peut ne pas être du JSON (page d'erreur 500) : on ne bloque pas.
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload.message || payload.error || 'Erreur lors de la création');
      }

      toast.success('Pièce créée avec succès');
      router.push('/admin/pieces');
      router.refresh();
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
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Création…' : 'Créer la pièce'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
