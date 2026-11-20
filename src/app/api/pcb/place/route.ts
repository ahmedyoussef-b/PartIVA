import { existsSync } from 'node:fs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';
import {
  detectKicadPython,
  dryRun,
  placeFootprint,
  resolveScriptPath,
} from '@/lib/pcb/kicad-bridge';

// Nécessite l'API classique `pcbnew` (processus Python) : runtime Node obligatoire.
export const runtime = 'nodejs';

export async function POST(req: Request) {
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
  const projectId = typeof b.projectId === 'string' ? b.projectId.trim() : '';
  const reference = typeof b.reference === 'string' ? b.reference.trim() : '';
  const libName = typeof b.libName === 'string' ? b.libName.trim() : '';
  const footprintName = typeof b.footprintName === 'string' ? b.footprintName.trim() : '';
  const value = typeof b.value === 'string' ? b.value.trim() : undefined;
  const xMm = typeof b.xMm === 'number' ? b.xMm : NaN;
  const yMm = typeof b.yMm === 'number' ? b.yMm : NaN;
  const layer = typeof b.layer === 'string' && b.layer.trim() ? b.layer.trim() : 'F.Cu';
  const dryRunFlag = b.dryRun === true;

  if (!projectId || !reference || !libName || !footprintName) {
    return NextResponse.json(
      { error: 'projectId, reference, libName, footprintName requis' },
      { status: 400 },
    );
  }
  if (!Number.isFinite(xMm) || !Number.isFinite(yMm)) {
    return NextResponse.json({ error: 'xMm et yMm doivent être des nombres' }, { status: 400 });
  }

  console.info('[PCB:PLACE] Requête reçue', {
    timestamp: new Date().toISOString(),
    projectId,
    reference,
  });

  // 3. Résoudre boardPath depuis PcbProject.kicadFilePath
  const project = await prisma.pcbProject.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
  }

  const boardPath = project.kicadFilePath;
  if (!boardPath) {
    return NextResponse.json(
      { error: 'kicadFilePath non renseigné pour ce projet' },
      { status: 400 },
    );
  }
  if (!existsSync(boardPath)) {
    return NextResponse.json({ error: `Fichier introuvable : ${boardPath}` }, { status: 400 });
  }

  // 4. Détecter l'interpréteur Python et le script
  const python = await detectKicadPython();
  if (!python) {
    return NextResponse.json({ error: 'Interpréteur Python KiCad introuvable' }, { status: 500 });
  }
  if (!resolveScriptPath()) {
    return NextResponse.json({ error: 'Script place_footprint.py introuvable' }, { status: 500 });
  }

  console.info('[PCB:PLACE] Placement demandé', {
    reference,
    libName,
    footprintName,
    xMm,
    yMm,
    dryRun: dryRunFlag,
  });

  // 5. Exécuter
  const args = { boardPath, libName, footprintName, reference, value, xMm, yMm, layer };
  let result;
  try {
    result = dryRunFlag ? await dryRun(args) : await placeFootprint(args);
  } catch (e) {
    console.error('[PCB:PLACE] Erreur', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur inattendue' },
      { status: 500 },
    );
  }

  if (!result.ok) {
    console.error('[PCB:PLACE] Erreur', result.error);
    return NextResponse.json({ error: result.error ?? 'Échec du placement' }, { status: 500 });
  }

  console.info('[PCB:PLACE] Résultat', {
    message: result.message,
    footprintCount: result.footprintCount,
  });

  return NextResponse.json({
    ok: true,
    message: result.message,
    footprintCount: result.footprintCount,
    wouldPlace: result.wouldPlace,
  });
}