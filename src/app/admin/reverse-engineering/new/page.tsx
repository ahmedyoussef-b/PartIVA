'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createREProjectFromForm } from '@/lib/actions/reverse-engineering';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { toast } from 'sonner';

export default function NewREProjectPage() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(createREProjectFromForm, null);

  // Redirection automatique après succès
  if (state?.success && state.projectId) {
    router.push(`/admin/reverse-engineering/${state.projectId}`);
    return null;
  }

  // Afficher une toast en cas d'erreur
  if (state?.error) {
    toast.error(state.error);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-heading font-bold text-tech-navy">Nouveau projet Reverse Engineering</h1>
            <p className="text-muted-foreground text-sm">
              Créez un nouveau projet de rétro-ingénierie CAO pour démarrer l&apos;analyse d&apos;une pièce.
            </p>
          </div>
        </div>

        <form action={formAction} className="space-y-6 bg-card border border-border rounded-xl p-6 shadow-sm">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg font-bold text-tech-navy">Informations du projet</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Les champs marqués d&apos;une astérisque sont requis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-medium text-sm">
                    Nom du projet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="ex: Rémote turbo compresseur"
                    required
                    disabled={isPending}
                    className={isPending ? 'opacity-70' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium text-sm">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Décrivez la pièce à rétro-ingénieriser..."
                    rows={4}
                    disabled={isPending}
                    className={isPending ? 'opacity-70' : ''}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <CardFooter className="flex flex-row items-center justify-between gap-4 bg-card/50 border-t border-border/50">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push('/admin/reverse-engineering')}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="px-6"
            >
              {isPending ? 'Création en cours...' : 'Créer le projet'}
            </Button>
          </CardFooter>
        </form>

        {state?.error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">
            <p className="text-sm">{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}