'use client';

import * as React from 'react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { signUp } from '@/lib/auth-client';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [company, setCompany] = React.useState('');
  const [contactName, setContactName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signUpError } = await signUp.email({
        email,
        password,
        name: `${company} - ${contactName}`,
      });

      if (signUpError) {
        setError(signUpError.message ?? 'Inscription impossible');
        setLoading(false);
        return;
      }

      toast.success('Bienvenue ! Votre compte client a été créé.');
      const targetUrl = '/client/dashboard/creer-piece';
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = targetUrl;
    } catch (err) {
      console.error('[Register] Erreur lors de l’inscription:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l’inscription');
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md border-border/60 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mb-1 flex justify-center">
          <Badge variant="outline" className="border-primary/30 text-primary">
            Adhésion Client Permanent
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold">Créer mon Espace Client Permanent</CardTitle>
        <CardDescription>
          Accédez au dépôt libre de photos de pièces à reproduire et visualisez vos pièces prêtes à
          l’envoi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          {/* E8P-S02-bis — anti-autofill : 3 couches (autoComplete off + leurres
              cachés + readOnly retiré au focus) — cf. login/page.tsx. */}
          <input
            type="text"
            name="fakeusernameremembered"
            aria-hidden="true"
            tabIndex={-1}
            style={{ display: 'none' }}
          />
          <input
            type="password"
            name="fakepasswordremembered"
            aria-hidden="true"
            tabIndex={-1}
            style={{ display: 'none' }}
          />

          <div className="space-y-2">
            <Label htmlFor="company">Nom de l’entreprise / Usine *</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              placeholder="Ex: Délice Danone, Poulina, Sancella..."
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Responsable maintenance ou achat *</Label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              placeholder="Ex: Tarek Mejri"
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email professionnel *</Label>
            <Input
              id="email"
              type="email"
              name="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="contact@entreprise.tn"
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <Input
              id="password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-2 font-bold shadow-md">
            <UserPlus className="h-4 w-4" />
            {loading ? 'Activation en cours...' : 'Activer mon compte & Déposer une pièce'}
          </Button>
        </form>

        <div className="border-t pt-4 text-center text-xs text-muted-foreground">
          Déjà client permanent ?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
