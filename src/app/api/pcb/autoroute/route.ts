import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';

export const runtime = 'nodejs';

export async function POST() {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }
  return NextResponse.json(
    {
      error:
        'Route dépréciée : utilisez POST /api/pcb/autoroute/freerouting. Le DSN est généré par KiCad (ExportSpecctraDSN).',
    },
    { status: 410 },
  );
}
