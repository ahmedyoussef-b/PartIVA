import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { SYNC_TABLES } from '@/lib/sync/tables';

/**
 * E8P-S04 — GET /api/desktop/sync/manifest
 *
 * Manifest de synchronisation desktop : liste des tables synchronisables
 * et leur stratégie (incrémentale vs full-refresh).
 * Sync unidirectionnelle web → local (D-E8P-S01-2), auth obligatoire (D-E8P-S01-9).
 */

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }

  return NextResponse.json({
    version: 1,
    sync_direction: 'web_to_local',
    tables: SYNC_TABLES,
  });
}
