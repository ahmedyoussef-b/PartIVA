'use client';

import * as React from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const result = await requestPasswordReset({ email: email.trim(), redirectTo });
      if (result?.error) {
        setError(result.error.message ?? 'Impossible d’envoyer l’email de réinitialisation.');
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
        <CardDescription>
          Indiquez votre email pour recevoir un lien de réinitialisation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {submitted ? (
          <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-700 dark:text-emerald-400">
            <p className="font-semibold">Vérifiez votre boîte de réception</p>
            <p className="text-xs">
              Si un compte est associé à cette adresse, un lien de réinitialisation vient d’être
              envoyé. Le lien est valable 1 heure.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="contact@usine.tn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full gap-2 font-bold shadow-md" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Envoyer le lien de réinitialisation
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
