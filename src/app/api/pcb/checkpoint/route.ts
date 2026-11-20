import { NextResponse } from 'next/server';
import { createCheckpoint } from '@/lib/pcb/checkpoint';
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
