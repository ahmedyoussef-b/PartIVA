'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    toast.success('Un lien de réinitialisation vous a été envoyé par email.')
  }

  return (
    <Card className="shadow-xl border-border/60">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
        <CardDescription>
          Indiquez votre email professionnel pour réinitialiser vos accès
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {submitted ? (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm space-y-2 text-center">
            <p className="font-semibold">Vérifiez votre boîte de réception</p>
            <p className="text-xs">
              Si un compte est associé à cette adresse, vous recevrez un lien dans quelques instants.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="contact@usine.tn" />
            </div>

            <Button type="submit" className="w-full gap-2 font-bold shadow-md">
              <Mail className="w-4 h-4" />
              Envoyer les instructions
            </Button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
