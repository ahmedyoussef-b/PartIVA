'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';
import type { SearchCandidate } from '@/core/ai-engine/skills/search/types';

export async function convertCandidateToPart(
  candidate: SearchCandidate,
): Promise<{ success: true; partId: string } | { success: false; error: string }> {
  try {
    await requireAdmin();

    const partNumber = `CAND-${Date.now()}`;
    const fileUrl = candidate.fileUrl ?? null;

    let fileType: 'CAD_STL' | 'CAD_STEP' | 'CAD_OBJ' | undefined;
    if (fileUrl) {
      const ext = fileUrl.slice(fileUrl.lastIndexOf('.')).toLowerCase();
      if (ext === '.stl') fileType = 'CAD_STL';
      else if (ext === '.step' || ext === '.stp') fileType = 'CAD_STEP';
      else if (ext === '.obj') fileType = 'CAD_OBJ';
    }

    const part = await prisma.part.create({
      data: {
        partNumber,
        name: candidate.name,
        description: 'Converti depuis le workspace',
        printableModelUrl: fileUrl,
        status: 'DRAFT',
      },
    });

    if (fileUrl && fileType) {
      await prisma.attachment.create({
        data: {
          partId: part.id,
          name: candidate.name,
          url: fileUrl,
          fileType,
          mimeType: 'application/octet-stream',
          kind: 'CAD',
        },
      });
    }

    return { success: true, partId: part.id };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur inconnue lors de la conversion' };
  }
}
