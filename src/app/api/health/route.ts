import { NextResponse } from 'next/server';

/**
 * Endpoint de santé (E5-S02).
 *
 * Monitoring / load-balancer probe. Sans auth, sans DB,
 * sans dépendance externe — retourne toujours 200 si
 * l'application est démarrée. Exposé en mode placeholder
 * comme en mode complet.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev',
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
