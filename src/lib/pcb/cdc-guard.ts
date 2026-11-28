// Garde CDC côté API — défense en profondeur : même un appel direct à une
// route de génération ne peut pas contourner la validation du cahier des charges.

import { prisma } from '@/lib/prisma';
import { CDC_NOT_VALIDATED_ERROR, CDC_NOT_VALIDATED_MESSAGE, evaluateCdcGate } from './cdc-gate';

export type CdcGuardResult =
  { ok: true } | { ok: false; status: number; error: string; message: string };

export async function checkCdcGate(projectId: string): Promise<CdcGuardResult> {
  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: {
      status: true,
      requirements: { select: { category: true, key: true, value: true, status: true } },
    },
  });
  if (!project) {
    return { ok: false, status: 404, error: 'Projet introuvable', message: 'Projet introuvable' };
  }
  const gate = evaluateCdcGate(project);
  if (!gate.ready) {
    return {
      ok: false,
      status: 409,
      error: CDC_NOT_VALIDATED_ERROR,
      message: gate.reason || CDC_NOT_VALIDATED_MESSAGE,
    };
  }
  return { ok: true };
}
