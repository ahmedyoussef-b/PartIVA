'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { PartTemplate } from '@/generated/prisma/client';

const SolutionMethodSchema = z.enum(['CATALOG', 'WORKSPACE', 'REVERSE', 'IMPORT']);

const CreatePartTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  material: z.string().optional(),
  dimensions: z.record(z.string(), z.any()).optional(),
  cadParams: z.record(z.string(), z.any()).optional(),
  analysisData: z.record(z.string(), z.any()).optional(),
  printableModelUrl: z.string().url().optional(),
  sourceMethod: SolutionMethodSchema.optional(),
});

const UpdatePartTemplateSchema = CreatePartTemplateSchema.partial().extend({
  id: z.string().cuid(),
});

export async function createPartTemplate(
  input: z.infer<typeof CreatePartTemplateSchema>,
): Promise<{ success: true; data: PartTemplate } | { success: false; error: string }> {
  try {
    const validated = CreatePartTemplateSchema.parse(input);

    const partTemplate = await prisma.partTemplate.create({
      data: validated,
    });

    revalidatePath('/admin/part-templates');

    return { success: true, data: partTemplate };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Données invalides' };
    }
    console.error('Error creating part template:', error);
    return { success: false, error: (error as Error)?.message || 'Échec de la création' };
  }
}

export async function updatePartTemplate(
  input: z.infer<typeof UpdatePartTemplateSchema>,
): Promise<{ success: true; data: PartTemplate } | { success: false; error: string }> {
  try {
    const { id, ...data } = UpdatePartTemplateSchema.parse(input);

    const partTemplate = await prisma.partTemplate.update({
      where: { id },
      data,
    });

    revalidatePath('/admin/part-templates');

    return { success: true, data: partTemplate };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Données invalides' };
    }
    console.error('Error updating part template:', error);
    return { success: false, error: (error as Error)?.message || 'Échec de la mise à jour' };
  }
}

export async function deletePartTemplate(
  id: string,
): Promise<{ success: true; data: PartTemplate } | { success: false; error: string }> {
  try {
    const validatedId = z.string().cuid().parse(id);

    const partTemplate = await prisma.partTemplate.delete({
      where: { id: validatedId },
    });

    revalidatePath('/admin/part-templates');

    return { success: true, data: partTemplate };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Données invalides' };
    }
    console.error('Error deleting part template:', error);
    return { success: false, error: (error as Error)?.message || 'Échec de la suppression' };
  }
}

export async function listPartTemplates(filters?: {
  categoryId?: string;
  sourceMethod?: string;
}): Promise<PartTemplate[]> {
  try {
    const where: { categoryId?: string; sourceMethod?: string } = {};
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters?.sourceMethod) {
      where.sourceMethod = filters.sourceMethod;
    }

    return await prisma.partTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  } catch (error) {
    console.error('Error listing part templates:', error);
    return [];
  }
}
