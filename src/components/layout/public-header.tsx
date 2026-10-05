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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top micro-bar */}
      <div className="hidden border-b border-border/30 bg-primary/5 px-4 py-1.5 text-xs text-muted-foreground md:block">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Atelier d’Usinage & Reverse Engineering Plastiques • Sousse & Sfax
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-primary" /> +216 27 80 37 61
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-muted-foreground">
              Mode Web Public • Espace Client Permanent
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Cog className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold leading-tight tracking-tight">PartIVA</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
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
                  'py-1 text-sm font-medium transition-colors hover:text-primary',
                  active
                    ? 'border-b-2 border-primary font-bold text-primary'
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
            className="p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="space-y-4 border-b bg-background px-4 py-6 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'rounded-md p-2.5 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary/10 font-semibold text-primary'
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
