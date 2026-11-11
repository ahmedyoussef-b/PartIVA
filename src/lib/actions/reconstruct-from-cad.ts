'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { PartTemplate, Solution } from '@/generated/prisma/client';
import { cadParamsSchema, type CadParams } from '@/core/ai-engine/skills/reconstruct/types';
import { isCadFile } from '@/lib/utils/file-formats';

const DimensionsSchema = z
  .object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    diameter: z.number().positive().optional(),
    material: z.string().min(1).optional(),
    unit: z.enum(['mm', 'cm']),
  })
  .refine((d) => d.length || d.width || d.height || d.diameter, {
    message: 'Au moins une dimension doit être fournie',
  });

const ReconstructFromCadSchema = z.object({
  cadFileId: z.string().cuid(),
  dimensions: DimensionsSchema,
  cadParams: cadParamsSchema.optional(),
  notes: z.string().max(2000).optional(),
});

export async function reconstructFromCad(
  input: z.infer<typeof ReconstructFromCadSchema>,
): Promise<
  | { success: true; data: { partTemplate: PartTemplate; solution: Solution } }
  | { success: false; error: string }
> {
  try {
    const validated = ReconstructFromCadSchema.parse(input);

    const cadFile = await prisma.cadFile.findUnique({
      where: { id: validated.cadFileId },
    });

    if (!cadFile) {
      return { success: false, error: 'Fichier CAO introuvable' };
    }

    if (!cadFile.requestId) {
      return { success: false, error: "Ce fichier CAO n'est lié à aucune demande" };
    }

    if (!isCadFile(cadFile.url)) {
      return { success: false, error: 'Format CAO non supporté' };
    }

    const request = await prisma.request.findUnique({
      where: { id: cadFile.requestId },
      select: { id: true, partDescription: true, suspectedMaterial: true },
    });

    if (!request) {
      return { success: false, error: 'Demande associée introuvable' };
    }

    const derivedCadParams: CadParams = validated.cadParams ?? {
      type: 'block',
      length: validated.dimensions.length,
      width: validated.dimensions.width,
      height: validated.dimensions.height,
      diameter: validated.dimensions.diameter,
      material: validated.dimensions.material ?? request.suspectedMaterial ?? undefined,
      unit: validated.dimensions.unit,
    };

    const result = await prisma.$transaction(async (tx) => {
      const partTemplate = await tx.partTemplate.create({
        data: {
          name: (cadFile.name || request.partDescription).slice(0, 200),
          description: request.partDescription,
          material: validated.dimensions.material ?? request.suspectedMaterial ?? null,
          dimensions: validated.dimensions as object,
          cadParams: derivedCadParams as object,
          analysisData: {
            source: 'cad_import',
            cadFileId: cadFile.id,
            notes: validated.notes ?? null,
          } as object,
          printableModelUrl: cadFile.url,
          sourceMethod: 'IMPORT',
        },
      });

      const solution = await tx.solution.create({
        data: {
          requestId: request.id,
          partTemplateId: partTemplate.id,
          method: 'IMPORT',
          confidence: 85,
          metadata: {
            cadFileId: cadFile.id,
            cadFileUrl: cadFile.url,
            dimensions: validated.dimensions,
            notes: validated.notes ?? null,
          } as object,
        },
      });

      return { partTemplate, solution };
    });

    revalidatePath(`/admin/demandes/${request.id}`);
    revalidatePath('/admin/part-templates');

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Données invalides' };
    }
    console.error('Error reconstructing from CAD:', error);
    return { success: false, error: (error as Error)?.message || 'Échec de la reconstruction' };
  }
}
