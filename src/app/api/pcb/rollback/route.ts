import { NextResponse } from 'next/server';
import { rollbackToCheckpoint } from '@/lib/pcb/checkpoint';
import { requireAdmin } from '@/lib/auth-admin';

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ message }, { status });
  }
  try {
    const body = await req.json();
    const { checkpointId } = body as { checkpointId?: string };

    if (!checkpointId) {
      return NextResponse.json({ error: 'checkpointId requis' }, { status: 400 });
    }

    const checkpoint = await rollbackToCheckpoint(checkpointId);
    return NextResponse.json({ rolledBackTo: checkpoint.id, label: checkpoint.label });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
