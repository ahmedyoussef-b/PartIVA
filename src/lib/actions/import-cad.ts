'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { CadFile } from '@/generated/prisma/client';

const ImportCadSchema = z.object({
  requestId: z.string().cuid(),
  name: z.string().min(1).max(255),
  url: z.string().url(),
  fileType: z.enum(['CAD_STL', 'CAD_STEP', 'CAD_IGES', 'CAD_OBJ', 'OTHER']),
  sizeBytes: z.number().int().positive().optional(),
});

export async function importCad(
  input: z.infer<typeof ImportCadSchema>,
): Promise<{ success: true; data: CadFile } | { success: false; error: string }> {
  try {
    const validated = ImportCadSchema.parse(input);

    const req = await prisma.request.findUnique({
      where: { id: validated.requestId },
      select: { id: true },
    });

    if (!req) {
      return { success: false, error: 'Demande introuvable' };
    }

    const cadFile = await prisma.cadFile.create({
      data: {
        requestId: validated.requestId,
        name: validated.name,
        url: validated.url,
        fileType: validated.fileType,
        sizeBytes: validated.sizeBytes,
      },
    });

    revalidatePath(`/admin/demandes/${validated.requestId}`);
    revalidatePath(`/admin/demandes/${validated.requestId}/import-cad`);

    return { success: true, data: cadFile };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Données invalides' };
    }
    console.error('Error importing CAD file:', error);
    return { success: false, error: (error as Error)?.message || "Échec de l'import" };
  }
}
