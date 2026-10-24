'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Download,
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
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { href: '/admin/recherche', label: 'Recherche', icon: Search },
  { href: '/admin/demandes', label: 'File Demandes', icon: Inbox, badge: '4' },
  { href: '/admin/reverse-engineering', label: 'Reverse CAO', icon: Wrench },
  { href: '/admin/pieces', label: 'Catalogue Pièces BDD', icon: Boxes },
  { href: '/admin/materiaux', label: 'Plastiques Techniques', icon: Layers },
  { href: '/admin/machines', label: 'Parc Machines CNC', icon: Cpu },
  { href: '/admin/usinage', label: 'Atelier Usinage', icon: Hammer },
  { href: '/admin/sync', label: 'Console Sync Cloud', icon: RefreshCw },
  { href: '/admin/audit', label: 'Journal d’Audit', icon: FileSpreadsheet },
  { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
  { href: '/admin/desktop-downloads', label: 'Téléchargements Desktop', icon: Download },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  return (
    <Sidebar className="bg-tech-navy border-r border-white/10 text-white">
      <SidebarHeader className="border-b border-white/10">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="bg-tech-primary shadow-tech-glow flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <Cog className="h-5 w-5 text-white" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="font-heading text-sm leading-none font-bold tracking-tight text-white">
                PartIVA
              </span>
              <span className="mt-1 font-mono text-[9px] tracking-wider text-white/60 uppercase">
                Atelier Admin
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <div className="px-3 pb-2">
          {open && (
            <span className="px-2 text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
              Opérations
            </span>
          )}
        </div>
        <SidebarMenu className="px-2">
          {ADMIN_NAV.map((item) => {
            // Skip desktop downloads in Tauri (desktop) mode
            if (item.href === '/admin/desktop-downloads' && isTauri) {
              return null;
            }
            const active =
              pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  href={item.href}
                  active={active}
                  title={item.label}
                  className="group data-[active=true]:bg-tech-primary data-[active=true]:shadow-tech-glow h-9 gap-2.5 rounded-lg px-2.5 text-white/70 transition-all hover:bg-white/10 hover:text-white data-[active=true]:text-white"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {open && <span className="flex-1 truncate text-sm">{item.label}</span>}
                  {open && item.badge && (
                    <Badge
                      variant="secondary"
                      className="h-5 rounded-full bg-white/20 px-1.5 font-mono text-[9px] text-white"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10">
        <div className="flex w-full flex-col gap-1 px-2 py-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            title="Aller sur le site public"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {open && <span>Voir le site public</span>}
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 transition-colors hover:bg-rose-500/20 hover:text-rose-200"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {open && <span>Déconnexion</span>}
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
