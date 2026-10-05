'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Notifications</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Alertes de fabrication, validation de modèles et expéditions.
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => (
          <Card
            key={notif.id}
            className={`transition-colors ${notif.unread ? 'border-primary/50 bg-primary/5' : ''}`}
          >
            <CardContent className="flex items-start gap-4 p-4">
              <div
                className={`shrink-0 rounded-full p-2.5 ${
                  notif.unread
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{notif.title}</h4>
                  <span className="font-mono text-[11px] text-muted-foreground">{notif.time}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{notif.desc}</p>
                <div className="pt-1">
                  <Link href={notif.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-primary"
                    >
                      Voir le dossier <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
