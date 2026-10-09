'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { signUp } from '@/lib/auth-client';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
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
    router.push('/client/dashboard/creer-piece');
  };

  return (
    <Card className="border-border/60 mx-auto max-w-md shadow-xl">
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
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border p-3 text-xs">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Nom de l’entreprise / Usine *</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              placeholder="Ex: Délice Danone, Poulina, Sancella..."
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email professionnel *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="contact@entreprise.tn"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-2 font-bold shadow-md">
            <UserPlus className="h-4 w-4" />
            {loading ? 'Activation en cours...' : 'Activer mon compte & Déposer une pièce'}
          </Button>
        </form>

        <div className="text-muted-foreground border-t pt-4 text-center text-xs">
          Déjà client permanent ?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Se connecter
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
