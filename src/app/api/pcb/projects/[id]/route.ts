import { existsSync } from 'node:fs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';

// Nécessite `node:fs` pour la vérification d'existence du fichier : runtime Node obligatoire.
export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Auth
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized';
    return NextResponse.json({ error: msg }, { status: msg === 'Forbidden' ? 403 : 401 });
  }

  // 2. Parse + validation manuelle du body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const kicadFilePath = typeof b.kicadFilePath === 'string' ? b.kicadFilePath.trim() : '';
  if (!kicadFilePath) {
    return NextResponse.json({ error: 'kicadFilePath requis' }, { status: 400 });
  }
  if (!kicadFilePath.toLowerCase().endsWith('.kicad_pcb')) {
    return NextResponse.json(
      { error: 'kicadFilePath doit pointer vers un fichier .kicad_pcb' },
      { status: 400 },
    );
  }

  console.info('[PCB:PROJECT] Mise à jour kicadFilePath', { id, kicadFilePath });

  // 3. Mise à jour (P2025 = projet introuvable)
  let updated: { id: string; kicadFilePath: string | null };
  try {
    updated = await prisma.pcbProject.update({
      where: { id },
      data: { kicadFilePath },
      select: { id: true, kicadFilePath: true },
    });
  } catch (e) {
    const code = (e as { code?: string } | null)?.code;
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
    }
    console.error('[PCB:PROJECT] Erreur mise à jour', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  // 4. Vérification informative (ne bloque pas : le fichier peut ne pas encore exister)
  const exists = existsSync(kicadFilePath);
  console.info('[PCB:PROJECT] kicadFilePath', { id, exists });

  return NextResponse.json({ id: updated.id, kicadFilePath: updated.kicadFilePath, exists });
}
