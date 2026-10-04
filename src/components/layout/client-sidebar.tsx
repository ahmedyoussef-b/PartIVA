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
  Camera,
  PackageCheck,
  User,
  PlusCircle,
  ExternalLink,
  LogOut,
  Cog,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const CLIENT_NAV = [
  {
    href: '/client/dashboard/creer-piece',
    label: 'Créer une pièce (Upload photos)',
    icon: Camera,
  },
  {
    href: '/client/dashboard/pieces-pretes',
    label: 'Pièces prêtes pour envoi',
    icon: PackageCheck,
  },
  {
    href: '/client/dashboard',
    label: 'Historique de mes pièces',
    icon: LayoutDashboard,
  },
  {
    href: '/client/dashboard/profil',
    label: 'Mon Entreprise',
    icon: User,
  },
]

export function ClientSidebar() {
  const pathname = usePathname()
  const { open } = useSidebar()

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/client/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-sm">
            <Cog className="h-5 w-5" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight leading-none text-foreground">
                Client Permanent
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Espace Fabrication
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {open && (
          <div className="px-2 pb-3">
            <Link href="/client/dashboard/creer-piece">
              <Button size="sm" className="w-full gap-2 font-semibold shadow-xs">
                <PlusCircle className="w-4 h-4" />
                Uploader une pièce
              </Button>
            </Link>
          </div>
        )}

        <SidebarMenu>
          {CLIENT_NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/client/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton href={item.href} active={active} title={item.label}>
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  {open && <span className="flex-1 truncate">{item.label}</span>}
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
            title="Retour au site public"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {open && <span>Retour au site public</span>}
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
