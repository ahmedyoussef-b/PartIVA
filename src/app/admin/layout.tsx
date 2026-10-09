'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { SyncStatusIndicator } from '@/components/layout/sync-status-indicator';
import { NotificationBell } from '@/components/layout/notification-bell';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSyncStore } from '@/lib/stores/sync-store';
import { useAppMode } from '@/lib/app-mode';
import { useSession, signOut } from '@/lib/auth-client';
import { ShieldAlert, ArrowLeft, Monitor, Lock, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { triggerSync } = useSyncStore();
  const { isTauri, setManualMode } = useAppMode();
  const { data: session, isPending } = useSession();

  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';

  React.useEffect(() => {
    if (!isTauri) return;
    const timer = setInterval(() => {
      triggerSync().catch(() => {});
    }, 45_000);
    return () => clearInterval(timer);
  }, [triggerSync, isTauri]);

  if (isPending || !isAdmin) {
    return (
      <div className="bg-muted/20 flex min-h-screen items-center justify-center p-4">
        <Card className="border-border/80 w-full max-w-2xl shadow-2xl">
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="mb-2 flex justify-center">
              <Badge variant="outline" className="border-amber-500/30 text-amber-600">
                Accès Restreint
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">
              Poste de Contrôle Atelier
            </CardTitle>
            <CardDescription className="mx-auto mt-1 max-w-lg text-sm leading-relaxed">
              Cette section est réservée aux techniciens et administrateurs habilités.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            <div className="bg-card text-muted-foreground space-y-3 rounded-xl border p-4 text-xs">
              <div className="text-foreground flex items-center gap-2 font-semibold">
                <Lock className="text-primary h-4 w-4" />
                Règles d’accès :
              </div>
              <ul className="list-inside list-disc space-y-2">
                <li>
                  <strong className="text-foreground">Mode Web Public :</strong> Réservé aux
                  clients.
                </li>
                <li>
                  <strong className="text-foreground">Espace Client Permanent :</strong> Upload et
                  suivi de pièces.
                </li>
                <li>
                  <strong className="text-foreground">Mode Hybride Tauri / Admin :</strong> Poste
                  atelier complet.
                </li>
              </ul>
            </div>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/">
                <Button variant="outline" className="w-full gap-2 sm:w-auto">
                  <ArrowLeft className="h-4 w-4" />
                  Retour à l’Accueil Public
                </Button>
              </Link>
              <Link href="/login">
                <Button className="w-full gap-2 font-semibold shadow-md sm:w-auto">
                  Se connecter
                </Button>
              </Link>
            </div>

            <div className="border-t pt-4 text-center">
              <p className="text-muted-foreground mb-2 text-[11px]">
                Environnement de développement & démonstration :
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setManualMode('tauri')}
                className="text-primary gap-1.5 text-xs"
              >
                <Monitor className="h-3.5 w-3.5" />
                Simuler le mode Hybride Tauri
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="bg-card/60 sticky top-0 z-20 flex h-16 items-center justify-between border-b px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Poste de Contrôle Atelier</span>
              <Badge
                variant="outline"
                className="border-primary/40 text-primary font-mono text-[10px]"
              >
                {isTauri ? 'Hybride Tauri • Atelier Local' : 'Mode Web Admin'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SyncStatusIndicator />
            <div className="bg-border hidden h-4 w-px sm:block" />
            <NotificationBell />
            <ThemeToggle />
            <div className="flex items-center gap-2.5 border-l pl-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-xs font-bold text-emerald-500">
                ADM
              </div>
              <span className="hidden text-xs font-medium sm:inline">
                {session?.user?.name || 'Admin'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                router.push('/login');
              }}
              className="text-muted-foreground h-7 px-2 text-[10px]"
              title="Déconnexion"
            >
              <LogOut className="mr-1 h-3.5 w-3.5" />
              Déconnexion
            </Button>
          </div>
        </header>

        <main className="bg-muted/10 flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
