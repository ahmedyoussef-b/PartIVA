'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { LogIn, ArrowRight, ShieldCheck, UserCheck, Camera, PackageCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState('m.bensalem@delice.tn')
  const [password, setPassword] = React.useState('••••••••')
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Connexion réussie')
      if (email.includes('admin') || email.includes('atelier')) {
        router.push('/admin/dashboard')
      } else {
        // Redirection directe vers la page d'upload photos de pièce client
        router.push('/client/dashboard/creer-piece')
      }
    }, 800)
  }

  const loginAsClient = () => {
    setEmail('m.bensalem@delice-danone.tn')
    setPassword('client123')
    toast.info('Identifiants Client Permanent pré-remplis')
  }

  return (
    <Card className="shadow-xl border-border/60 max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-1">
          <Badge variant="outline" className="text-primary border-primary/30">
            Espace Client Permanent
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold">Connexion Client Permanent</CardTitle>
        <CardDescription>
          Accédez au dépôt de photos de pièces et au suivi des pièces prêtes pour envoi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shortcut button */}
        <div className="flex gap-2 justify-center pb-2">
          <Button variant="outline" size="sm" onClick={loginAsClient} className="text-xs gap-1.5 w-full">
            <UserCheck className="w-3.5 h-3.5 text-primary" />
            Remplir compte démo Client Permanent
          </Button>
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
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
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
            <LogIn className="w-4 h-4" />
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-4 border-t space-y-2">
          <p>
            Vous n’êtes pas encore client permanent ?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              S’enregistrer
            </Link>
          </p>
          <p className="text-[11px] text-muted-foreground/80">
            Note : L’administration atelier complète est réservée au mode hybride bureau Tauri.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
