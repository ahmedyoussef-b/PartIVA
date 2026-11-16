import { NextResponse } from 'next/server';
import { rollbackToCheckpoint } from '@/lib/pcb/checkpoint';

export async function POST(req: Request) {
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
