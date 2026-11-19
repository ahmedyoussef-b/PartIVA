'use client';

import * as React from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

// React 19 / Next 16 : next-themes injecte un <script> anti-FOUC dans l'arbre
// client, ce que React signale ("Encountered a script tag..."). La copie rendue
// côté client est marquée comme bloc de données inerte (type non-JS) : React
// l'ignore sans warning, tandis que la copie SSR (type omis) s'exécute avant
// le premier paint et applique le thème (réf. next-themes #385/#387).
const themeScriptProps =
  typeof window === 'undefined' ? undefined : ({ type: 'application/json' } as const);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      scriptProps={themeScriptProps}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
