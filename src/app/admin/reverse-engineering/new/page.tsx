'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createREProjectFromForm } from '@/lib/actions/reverse-engineering';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="bg-card border-border rounded-xl border p-6">
          <div className="space-y-2">
            <h1 className="font-heading text-tech-navy text-3xl font-bold">
              Nouveau projet Reverse Engineering
            </h1>
            <p className="text-muted-foreground text-sm">
              Créez un nouveau projet de rétro-ingénierie CAO pour démarrer l&apos;analyse
              d&apos;une pièce.
            </p>
          </div>
        </div>

        <form
          action={formAction}
          className="bg-card border-border space-y-6 rounded-xl border p-6 shadow-sm"
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-tech-navy text-lg font-bold">
                Informations du projet
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Les champs marqués d&apos;une astérisque sont requis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
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
                  <Label htmlFor="description" className="text-sm font-medium">
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

          <CardFooter className="bg-card/50 border-border/50 flex flex-row items-center justify-between gap-4 border-t">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push('/admin/reverse-engineering')}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending} className="px-6">
              {isPending ? 'Création en cours...' : 'Créer le projet'}
            </Button>
          </CardFooter>
        </form>

        {state?.error && (
          <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-4">
            <p className="text-sm">{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}


