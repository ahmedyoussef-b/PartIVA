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
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-tech-sm">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-semibold text-gray-900">
                Espace Client
              </span>
              <Badge
                variant="outline"
                className="border-tech-primary/40 text-tech-primary font-mono text-[10px]"
              >
                Compte Industriel Actif
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
            <div className="flex items-center gap-2.5 border-l border-gray-200 pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-tech-primary/30 bg-tech-primary/10 text-xs font-bold text-tech-primary">
                MB
              </div>
              <span className="hidden text-xs font-medium text-gray-700 sm:inline">
                M. Ben Salem
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
