'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Cog, Phone, ArrowRight, Menu, X, UserCheck, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';

// En mode Web public, accès réservé à 2 pages uniquement : Accueil et Contact & Atelier
const NAV_ITEMS = [
  { href: '/', label: 'Accueil' },
  { href: '/contact', label: 'Contact & Atelier' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
      {/* Top micro-bar */}
      <div className="border-border/30 bg-primary/5 text-muted-foreground hidden border-b px-4 py-1.5 text-xs md:block">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-foreground flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Atelier d’Usinage & Reverse Engineering Plastiques • Sousse & Sfax
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <Phone className="text-primary h-3 w-3" /> +216 27 80 37 61
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground font-mono text-[11px]">
              Mode Web Public • Espace Client Permanent
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg shadow-sm">
            <Cog className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base leading-tight font-bold tracking-tight">PartIVA</span>
            <span className="text-muted-foreground font-mono text-[11px] tracking-wider uppercase">
              Usinage Plastiques Industriels
            </span>
          </div>
        </Link>

        {/* Desktop Nav - 2 pages uniquement */}
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'hover:text-primary py-1 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary text-primary border-b-2 font-bold'
                    : 'text-muted-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions Client Permanent */}
        <div className="hidden items-center gap-3 sm:flex">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-1.5 font-medium">
              <UserCheck className="h-4 w-4" />
              Connexion Client
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="gap-2 font-semibold shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Devenir Client Permanent
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="text-foreground p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="bg-background space-y-4 border-b px-4 py-6 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'rounded-md p-2.5 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 border-t pt-4">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full gap-2">
                <UserCheck className="h-4 w-4" />
                Connexion Client
              </Button>
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full gap-2 font-semibold">
                Devenir Client Permanent <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
