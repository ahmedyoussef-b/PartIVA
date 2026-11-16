import { NextResponse } from 'next/server';
import { createCheckpoint } from '@/lib/pcb/checkpoint';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, label } = body as { projectId?: string; label?: string };

    if (!projectId || !label) {
      return NextResponse.json({ error: 'projectId et label requis' }, { status: 400 });
    }

    const checkpoint = await createCheckpoint(projectId, label);
    return NextResponse.json({ checkpointId: checkpoint.id, createdAt: checkpoint.createdAt });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
