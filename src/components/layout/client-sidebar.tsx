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
  LayoutDashboard,
  Camera,
  PackageCheck,
  PlusCircle,
  ExternalLink,
  LogOut,
  Cog,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const CLIENT_NAV = [
  {
    href: '/client/dashboard/creer-piece',
    label: 'Créer une pièce (Upload photos)',
    icon: Camera,
  },
  {
    href: '/client/dashboard/recherche',
    label: 'Recherche',
    icon: Search,
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
];

export function ClientSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <Sidebar className="bg-tech-navy border-r border-white/10 text-white">
      <SidebarHeader className="border-b border-white/10">
        <Link href="/client/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="bg-tech-primary shadow-tech-glow flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <Cog className="h-5 w-5 text-white" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="font-heading text-sm leading-none font-bold tracking-tight text-white">
                PartIVA
              </span>
              <span className="mt-1 font-mono text-[9px] tracking-wider text-white/60 uppercase">
                Espace Client
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {open && (
          <div className="px-3 pb-4">
            <Link href="/client/dashboard/creer-piece">
              <Button
                size="sm"
                className="bg-tech-primary shadow-tech-glow hover:bg-tech-primary-deep w-full gap-2 rounded-lg font-semibold text-white"
              >
                <PlusCircle className="h-4 w-4" />
                Uploader une pièce
              </Button>
            </Link>
          </div>
        )}

        <div className="px-3 pb-2">
          {open && (
            <span className="px-2 text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
              Suivi
            </span>
          )}
        </div>
        <SidebarMenu className="px-2">
          {CLIENT_NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/client/dashboard' && pathname.startsWith(item.href));
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
            title="Retour au site public"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {open && <span>Retour au site public</span>}
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
