'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { isTauri, loadToken } from '@/lib/data-client';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const isTauriEnv = isTauri();
  const [authorized, setAuthorized] = React.useState(!isTauriEnv);
  const [checking, setChecking] = React.useState(isTauriEnv);

  React.useEffect(() => {
    // En web, le guard ne s&rsquo;applique pas (BetterAuth gère via cookies)
    if (!isTauriEnv) {
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
            router.push('/login');
          }
        }
      } catch {
        if (mounted) {
          router.push('/login');
        }
      } finally {
        if (mounted) setChecking(false);
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, [isTauriEnv, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Vérification de l&rsquo;accès...</div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
