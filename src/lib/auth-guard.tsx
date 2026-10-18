'use client';

import * as React from 'react';
import { isTauri, loadToken } from '@/lib/data-client';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [authorized, setAuthorized] = React.useState(false);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    // En web, le guard ne s'applique pas (BetterAuth gère via cookies)
    if (!isTauri()) {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    // En desktop, vérifier le token dans le keyring
    let mounted = true;
    async function checkAuth() {
      try {
        const token = await loadToken();
        if (mounted) {
          if (token) {
            setAuthorized(true);
          } else {
            window.location.href = '/login';
          }
        }
      } catch {
        if (mounted) {
          window.location.href = '/login';
        }
      } finally {
        if (mounted) setChecking(false);
      }
    }
    checkAuth();
    return () => { mounted = false; };
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Vérification de l'accès...</div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}