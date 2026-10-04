'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { SyncStatusIndicator } from '@/components/layout/sync-status-indicator'
import { NotificationBell } from '@/components/layout/notification-bell'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useSyncStore } from '@/lib/stores/sync-store'
import { useAppMode } from '@/lib/app-mode'
import { useAuthStore } from '@/lib/stores/auth-store'
import {
  ShieldAlert,
  ArrowLeft,
  Monitor,
  Lock,
  ExternalLink,
  LogOut,
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { triggerSync } = useSyncStore()
  const { isTauri, isLoaded, setManualMode } = useAppMode()
  const { user, isAuthenticated, logout } = useAuthStore()

  const isAdmin = isAuthenticated && user?.role === 'admin'

  React.useEffect(() => {
    if (!isTauri) return
    const timer = setInterval(() => {
      triggerSync().catch(() => {})
    }, 45_000)
    return () => clearInterval(timer)
  }, [triggerSync, isTauri])

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-2xl border-border/80">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="flex justify-center mb-2">
              <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                Accès Restreint
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">
              Poste de Contrôle Atelier
            </CardTitle>
            <CardDescription className="text-sm max-w-lg mx-auto mt-1 leading-relaxed">
              Cette section est réservée aux techniciens et administrateurs habilités.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            <div className="rounded-xl border bg-card p-4 space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Lock className="w-4 h-4 text-primary" />
                Règles d’accès :
              </div>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <strong className="text-foreground">Mode Web Public :</strong> Réservé aux clients.
                </li>
                <li>
                  <strong className="text-foreground">Espace Client Permanent :</strong> Upload et suivi de pièces.
                </li>
                <li>
                  <strong className="text-foreground">Mode Hybride Tauri / Admin :</strong> Poste atelier complet.
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Retour à l’Accueil Public
                </Button>
              </Link>
              <Link href="/login">
                <Button className="w-full sm:w-auto gap-2 font-semibold shadow-md">
                  Se connecter
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t text-center">
              <p className="text-[11px] text-muted-foreground mb-2">
                Environnement de développement & démonstration :
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setManualMode('tauri')}
                className="text-xs text-primary gap-1.5"
              >
                <Monitor className="w-3.5 h-3.5" />
                Simuler le mode Hybride Tauri
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b px-6 bg-card/60 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Poste de Contrôle Atelier</span>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                {isTauri ? 'Hybride Tauri • Atelier Local' : 'Mode Web Admin'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SyncStatusIndicator />
            <div className="h-4 w-px bg-border hidden sm:block" />
            <NotificationBell />
            <ThemeToggle />
            <div className="flex items-center gap-2.5 pl-2 border-l">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
                ADM
              </div>
              <span className="text-xs font-medium hidden sm:inline">{user?.name || 'Admin'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout()
                router.push('/login')
              }}
              className="text-[10px] h-7 px-2 text-muted-foreground"
              title="Déconnexion"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Déconnexion
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 bg-muted/10 overflow-y-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
