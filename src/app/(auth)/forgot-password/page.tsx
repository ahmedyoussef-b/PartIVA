'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success('Un lien de réinitialisation vous a été envoyé par email.');
  };

  return (
    <Card className="border-border/60 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
        <CardDescription>
          Indiquez votre email professionnel pour réinitialiser vos accès
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {submitted ? (
          <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-700 dark:text-emerald-400">
            <p className="font-semibold">Vérifiez votre boîte de réception</p>
            <p className="text-xs">
              Si un compte est associé à cette adresse, vous recevrez un lien dans quelques
              instants.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="contact@usine.tn" />
            </div>

            <Button type="submit" className="w-full gap-2 font-bold shadow-md">
              <Mail className="h-4 w-4" />
              Envoyer les instructions
            </Button>
          </form>
        )}

        <div className="pt-2 text-center">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
