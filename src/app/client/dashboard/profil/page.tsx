'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { User, Building, Phone, Mail, MapPin, ShieldCheck, Save } from 'lucide-react'

export default function ClientProfilePage() {
  const [loading, setLoading] = React.useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Informations de profil mises à jour.')
    }, 600)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Profil Entreprise</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gérez les coordonnées de facturation, adresses de livraison usine et contacts maintenance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations de l’Établissement</CardTitle>
          <CardDescription>
            Ces données sont utilisées pour l’édition des devis et bons de livraison.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Raison sociale</Label>
                <Input id="company" defaultValue="Délice Danone Soliman SA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matricule">Matricule Fiscal</Label>
                <Input id="matricule" defaultValue="1234567/A/M/000" font-mono="true" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Responsable Maintenance</Label>
                <Input id="contactName" defaultValue="Mohamed Ben Salem" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Téléphone direct usine</Label>
                <Input id="contactPhone" defaultValue="+216 98 456 123" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email de facturation & devis</Label>
                <Input id="email" type="email" defaultValue="m.bensalem@delice-danone.tn" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville & Délégation</Label>
                <Input id="city" defaultValue="Soliman, Nabeul" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse de livraison usine</Label>
              <Input id="address" defaultValue="Zone Industrielle Soliman, BP 42" />
            </div>

            <Button type="submit" disabled={loading} className="gap-2 font-bold shadow-md">
              <Save className="w-4 h-4" />
              {loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
