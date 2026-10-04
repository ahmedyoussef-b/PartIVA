'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle2, Clock, Hammer, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ClientNotificationsPage() {
  const notifications = [
    {
      id: 'n1',
      title: 'Correspondance 3D identifiée à 88% (Étoile TetraPak)',
      time: 'Il y a 35 minutes',
      desc: 'Le candidat CAO PL-004812 a été validé par notre bureau d’études. Validation lancée pour usinage en UHMW-PE.',
      unread: true,
      href: '/client/dashboard/demandes/a1111111-2222-3333-4444-555555555551',
    },
    {
      id: 'n2',
      title: 'Lancement de l’usinage CNC (Patin d’usure STIP)',
      time: 'Il y a 2 heures',
      desc: 'Votre lot de patins en PA66 est actuellement en cours d’usinage sur le centre 5 axes DMG Mori.',
      unread: false,
      href: '/client/dashboard/demandes/a1111111-2222-3333-4444-555555555554',
    },
    {
      id: 'n3',
      title: 'Devis technique disponible',
      time: 'Hier à 16:45',
      desc: 'Votre demande #REQ-1039 a été chiffrée en matière PTFE haute température.',
      unread: false,
      href: '/client/dashboard/demandes/a1111111-2222-3333-4444-555555555553',
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Alertes de fabrication, validation de modèles et expéditions.
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => (
          <Card
            key={notif.id}
            className={`transition-colors ${notif.unread ? 'border-primary/50 bg-primary/5' : ''}`}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div
                className={`p-2.5 rounded-full shrink-0 ${
                  notif.unread
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{notif.title}</h4>
                  <span className="text-[11px] text-muted-foreground font-mono">{notif.time}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{notif.desc}</p>
                <div className="pt-1">
                  <Link href={notif.href}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-primary gap-1">
                      Voir le dossier <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
