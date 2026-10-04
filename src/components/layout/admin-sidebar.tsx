'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Inbox,
  Wrench,
  Boxes,
  Layers,
  Cpu,
  Hammer,
  RefreshCw,
  FileSpreadsheet,
  Settings,
  Cog,
  LogOut,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { href: '/admin/demandes', label: 'File Demandes', icon: Inbox, badge: '4' },
  { href: '/admin/reverse-engineering', label: 'Reverse CAO', icon: Wrench },
  { href: '/admin/pieces', label: 'Catalogue Pièces BDD', icon: Boxes },
  { href: '/admin/materiaux', label: 'Plastiques Techniques', icon: Layers },
  { href: '/admin/machines', label: 'Parc Machines CNC', icon: Cpu },
  { href: '/admin/usinage', label: 'Atelier Usinage', icon: Hammer },
  { href: '/admin/sync', label: 'Console Sync Cloud', icon: RefreshCw },
  { href: '/admin/audit', label: 'Journal d’Audit', icon: FileSpreadsheet },
  { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { open } = useSidebar()

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-sm">
            <Cog className="h-5 w-5" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight leading-none text-foreground">
                Atelier Admin
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                BDD Locale • SQLite
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <div className="px-2 pb-2">
          {open && (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
              Opérations Atelier
            </span>
          )}
        </div>
        <SidebarMenu>
          {ADMIN_NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton href={item.href} active={active} title={item.label}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {open && <span className="flex-1 truncate">{item.label}</span>}
                  {open && item.badge && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono">
                      {item.badge}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <div className="w-full flex flex-col gap-1">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors"
            title="Aller sur le site public"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {open && <span>Voir le site public</span>}
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs text-rose-500 hover:text-rose-600 p-2 rounded-md hover:bg-rose-500/10 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {open && <span>Déconnexion</span>}
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
