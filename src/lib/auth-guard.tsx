'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Vérification de l&rsquo;accès...</div>
      </div>
    );
  }

  if (!session?.user) {
    router.replace('/login');
    return null;
  }

  return <>{children}</>;
}