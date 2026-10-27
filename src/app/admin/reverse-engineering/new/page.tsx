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
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold text-tech-navy">
              Nouveau projet Reverse Engineering
            </h1>
            <p className="text-sm text-muted-foreground">
              Créez un nouveau projet de rétro-ingénierie CAO pour démarrer l&apos;analyse
              d&apos;une pièce.
            </p>
          </div>
        </div>

        <form
          action={formAction}
          className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg font-bold text-tech-navy">
                Informations du projet
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
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

          <CardFooter className="flex flex-row items-center justify-between gap-4 border-t border-border/50 bg-card/50">
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
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
            <p className="text-sm">{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
