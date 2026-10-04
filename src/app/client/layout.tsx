import * as React from 'react'
import { ClientSidebar } from '@/components/layout/client-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { NotificationBell } from '@/components/layout/notification-bell'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Badge } from '@/components/ui/badge'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <ClientSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b px-6 bg-card/60 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Délice Danone Soliman</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                Compte Industriel Actif
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
            <div className="flex items-center gap-2.5 pl-2 border-l">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                MB
              </div>
              <span className="text-xs font-medium hidden sm:inline">M. Ben Salem</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 bg-muted/10 overflow-y-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
