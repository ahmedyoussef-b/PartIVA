'use client';

import * as React from 'react';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`border-border/40 text-muted-foreground h-9 w-9 rounded-lg border ${className ?? ''}`}
        aria-label="Changer de thème"
      >
        <span className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`border-border/40 bg-background/50 hover:bg-accent hover:text-accent-foreground relative h-9 w-9 rounded-lg border transition-all duration-200 ${className ?? ''}`}
          aria-label="Basculer le thème clair / sombre"
        >
          <Sun className="h-[1.15rem] w-[1.15rem] scale-100 rotate-0 text-amber-500 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.15rem] w-[1.15rem] scale-0 rotate-90 text-sky-400 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Changer le mode d&apos;affichage</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex cursor-pointer items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            Clair
          </span>
          {theme === 'light' && <Check className="text-primary h-3.5 w-3.5" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex cursor-pointer items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-sky-400" />
            Sombre
          </span>
          {theme === 'dark' && <Check className="text-primary h-3.5 w-3.5" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex cursor-pointer items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Monitor className="text-muted-foreground h-4 w-4" />
            Système
          </span>
          {theme === 'system' && <Check className="text-primary h-3.5 w-3.5" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
