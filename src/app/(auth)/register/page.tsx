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
import { UserPlus, Sparkles, ArrowRight, Camera } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Bienvenue ! Votre compte client permanent a été activé.')
      // Redirection directe vers la page d'upload photos de la pièce
      router.push('/client/dashboard/creer-piece')
    }, 800)
  }

  return (
    <Card className="shadow-xl border-border/60 max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-1">
          <Badge variant="outline" className="text-primary border-primary/30">
            Adhésion Client Permanent
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold">Créer mon Espace Client Permanent</CardTitle>
        <CardDescription>
          Accédez au dépôt libre de photos de pièces à reproduire et visualisez vos pièces prêtes à l’envoi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Nom de l’entreprise / Usine *</Label>
            <Input id="company" required placeholder="Ex: Délice Danone, Poulina, Sancella..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Responsable maintenance ou achat *</Label>
            <Input id="name" required placeholder="Ex: Tarek Mejri" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email professionnel *</Label>
            <Input id="email" type="email" required placeholder="contact@entreprise.tn" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <Input id="password" type="password" required placeholder="••••••••" />
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-2 font-bold shadow-md">
            <UserPlus className="w-4 h-4" />
            {loading ? 'Activation en cours...' : 'Activer mon compte & Déposer une pièce'}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          Déjà client permanent ?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Se connecter
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
