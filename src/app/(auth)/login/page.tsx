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
import { useAuthStore } from '@/lib/stores/auth-store';
import { LogIn, ShieldCheck, UserCheck, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const login = useAuthStore((s) => s.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const success = login(email, password);
      if (!success) {
        toast.error('Email ou mot de passe incorrect');
        return;
      }
      toast.success('Connexion réussie');
      if (email.includes('admin') || email.includes('atelier')) {
        router.push('/admin/dashboard');
      } else {
        router.push('/client/dashboard/creer-piece');
      }
    }, 600);
  };

  const loginAsClient = () => {
    setEmail('m.bensalem@delice.tn');
    setPassword('client123');
    toast.info('Identifiants Client Permanent pré-remplis');
  };

  const loginAsAdmin = () => {
    setEmail('admin@partiva.tn');
    setPassword('admin123');
    toast.info('Identifiants Admin pré-remplis');
  };

  return (
    <Card className="mx-auto max-w-md border-border/60 shadow-xl">
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
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={loginAsClient} className="gap-1.5 text-xs">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            Client
          </Button>
          <Button variant="outline" size="sm" onClick={loginAsAdmin} className="gap-1.5 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
            Admin
          </Button>
        </div>

        <div className="space-y-1 text-[11px] text-muted-foreground">
          <p className="font-semibold text-foreground">Comptes de démo :</p>
          <p>Admin : admin@partiva.tn / admin123</p>
          <p>Client : m.bensalem@delice.tn / client123</p>
        </div>

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
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
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

        <div className="space-y-2 border-t pt-4 text-center text-xs text-muted-foreground">
          <p>
            Pas encore de compte ?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              S’enregistrer
            </Link>
          </p>
          <p className="text-[11px] text-muted-foreground/80">
            Accès admin restreint au personnel habilité.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
