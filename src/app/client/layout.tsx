import * as React from 'react';
import { ClientSidebar } from '@/components/layout/client-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from '@/components/layout/notification-bell';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Badge } from '@/components/ui/badge';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ClientSidebar />
      <SidebarInset>
        <header className="bg-card/60 sticky top-0 z-20 flex h-16 items-center justify-between border-b px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Délice Danone Soliman</span>
              <Badge variant="outline" className="font-mono text-[10px]">
                Compte Industriel Actif
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
            <div className="flex items-center gap-2.5 border-l pl-2">
              <div className="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
                MB
              </div>
              <span className="hidden text-xs font-medium sm:inline">M. Ben Salem</span>
            </div>
          </div>
        </header>
        <main className="bg-muted/10 flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
