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
import { signIn } from '@/lib/auth-client';
import { LogIn, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await signIn.email({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message ?? 'Identifiants invalides');
      setLoading(false);
      return;
    }

    toast.success('Connexion réussie');

    const role = (data?.user as { role?: string } | undefined)?.role;
    if (role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else {
      router.push('/client/dashboard/creer-piece');
    }
  };

  return (
    <Card className="border-border/60 mx-auto max-w-md shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mb-1 flex justify-center">
          <Badge variant="outline" className="border-primary/30 text-primary">
            Espace de Connexion
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
        <CardDescription>
          Accédez à l’espace client ou au poste de contrôle atelier.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-start">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
        </div>

        {error ? (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border p-3 text-xs">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Link href="/forgot-password" className="text-primary text-xs hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-2 font-bold shadow-md">
            <LogIn className="h-4 w-4" />
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>

        <div className="text-muted-foreground space-y-2 border-t pt-4 text-center text-xs">
          <p>
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              S’enregistrer
            </Link>
          </p>
          <p className="text-muted-foreground/80 text-[11px]">
            Accès admin restreint au personnel habilité.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
