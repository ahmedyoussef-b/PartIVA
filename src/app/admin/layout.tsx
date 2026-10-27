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
import { loadToken, logout } from '@/lib/data-client';
import { ShieldAlert, ArrowLeft, Lock, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { triggerSync } = useSyncStore();
  const { isTauri } = useAppMode();
  const { data: session, isPending } = useSession();

  const [tauriAuthed, setTauriAuthed] = React.useState(!isTauri);
  const [tauriChecking, setTauriChecking] = React.useState(isTauri);

  React.useEffect(() => {
    if (!isTauri) {
      return;
    }
    let mounted = true;
    async function checkAuth() {
      try {
        const token = await loadToken();
        if (mounted) setTauriAuthed(!!token);
      } catch {
        if (mounted) setTauriAuthed(false);
      } finally {
        if (mounted) setTauriChecking(false);
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, [isTauri]);

  React.useEffect(() => {
    if (!isTauri) return;
    const timer = setInterval(() => {
      triggerSync().catch(() => {});
    }, 45_000);
    return () => clearInterval(timer);
  }, [triggerSync, isTauri]);

  // Web : session.role === 'ADMIN' — Tauri : token exists
  const isAdmin = isTauri
    ? tauriAuthed
    : (session?.user as { role?: string } | undefined)?.role === 'ADMIN';
  const isLoading = isTauri ? tauriChecking : isPending;

  if (isLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-2xl border-border/80 shadow-2xl">
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
            <div className="space-y-3 rounded-xl border bg-card p-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Lock className="h-4 w-4 text-primary" />
                Règles d&rsquo;accès :
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
                  Retour à l&rsquo;Accueil Public
                </Button>
              </Link>
              <Link href="/login">
                <Button className="w-full gap-2 font-semibold shadow-md sm:w-auto">
                  Se connecter
                </Button>
              </Link>
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
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-tech-sm">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-semibold text-gray-900">
                Poste de Contrôle Atelier
              </span>
              <Badge
                variant="outline"
                className="border-tech-primary/40 font-mono text-[10px] text-tech-primary"
              >
                {isTauri ? 'Hybride Tauri • Atelier Local' : 'Mode Web Admin'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SyncStatusIndicator />
            <div className="hidden h-4 w-px bg-gray-200 sm:block" />
            <NotificationBell />
            <ThemeToggle />
            <div className="flex items-center gap-2.5 border-l border-gray-200 pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-50 text-xs font-bold text-emerald-600">
                ADM
              </div>
              <span className="hidden text-xs font-medium text-gray-700 sm:inline">
                {isTauri ? 'Admin (Tauri)' : session?.user?.name || 'Admin'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (isTauri) {
                  await logout();
                } else {
                  await signOut();
                }
                router.push('/login');
              }}
              className="h-8 gap-1.5 px-3 text-xs text-gray-600 hover:text-gray-900"
              title="Déconnexion"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
