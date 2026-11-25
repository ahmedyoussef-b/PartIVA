import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { computeWizardState } from '@/lib/pcb/wizard-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** État BDD + plateau lu à chaque appel : source du polling temps réel du wizard. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }
  const { id } = await params;
  const state = await computeWizardState(id);
  if (!state) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
  return NextResponse.json({ ok: true, state });
}
