'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { resetPassword } from '@/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const urlError = searchParams.get('error');

  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    urlError === 'INVALID_TOKEN'
      ? 'Ce lien est invalide ou a expiré. Demandez un nouveau lien.'
      : null,
  );
  const [done, setDone] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('Lien de réinitialisation manquant. Demandez un nouveau lien.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({ newPassword: password, token });
      if (result?.error) {
        setError(result.error.message ?? 'Impossible de réinitialiser le mot de passe.');
        return;
      }
      setDone(true);
      setTimeout(() => {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/login';
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Nouveau mot de passe</CardTitle>
        <CardDescription>Définissez un nouveau mot de passe pour votre compte</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {done ? (
          <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="mx-auto h-5 w-5" />
            <p className="font-semibold">Mot de passe mis à jour</p>
            <p className="text-xs">Redirection vers la connexion…</p>
          </div>
        ) : !token ? (
          <div className="space-y-4">
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error ?? 'Lien de réinitialisation manquant ou invalide.'}
            </div>
            <Link href="/forgot-password" className="block">
              <Button variant="outline" className="w-full">
                Demander un nouveau lien
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <Input
                id="confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full gap-2 font-bold shadow-md" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Mettre à jour le mot de passe
            </Button>
          </form>
        )}

        <div className="pt-2 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <Card className="border-border/60 shadow-xl">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Chargement…
          </CardContent>
        </Card>
      }
    >
      <ResetPasswordForm />
    </React.Suspense>
  );
}
