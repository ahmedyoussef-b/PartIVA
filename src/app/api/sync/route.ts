/**
 * E0-S07b-3-D (D48) — /api/sync is a STUB.
 *
 * Current behavior: returns a fixed simulated payload
 * ({ status: 'success', received: 2, ids: [1041, 1042], timestamp }).
 * No real synchronization logic.
 *
 * Consumer: src/lib/stores/sync-store.ts (triggerSync) —
 * used by src/app/admin/sync/sync-client.tsx (manual button + 45s daemon).
 *
 * Real sync implementation deferred to E1 (Modélisation métier).
 */
import { NextResponse } from 'next/server';

export async function POST() {
  // Simulates cloud Neon pull
  return NextResponse.json({
    status: 'success',
    received: 2,
    ids: [1041, 1042],
    timestamp: new Date().toISOString(),
  });
}
