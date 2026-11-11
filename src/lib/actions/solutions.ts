'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Prisma, Solution } from '@/generated/prisma/client';

const SolutionMethodSchema = z.enum(['CATALOG', 'WORKSPACE', 'REVERSE', 'IMPORT']);

const CreateSolutionSchema = z.object({
  requestId: z.string().cuid(),
  partTemplateId: z.string().cuid().optional(),
  method: SolutionMethodSchema,
  confidence: z.number().min(0).max(100).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const ValidateSolutionSchema = z.object({
  id: z.string().cuid(),
  validatedAt: z.string().datetime().optional(),
});

const LinkSolutionToTemplateSchema = z.object({
  solutionId: z.string().cuid(),
  partTemplateId: z.string().cuid(),
});

export async function createSolution(
  input: z.infer<typeof CreateSolutionSchema>,
): Promise<{ success: true; data: Solution } | { success: false; error: string }> {
  try {
    const validated = CreateSolutionSchema.parse(input);

    const request = await prisma.request.findUnique({
      where: { id: validated.requestId },
      select: { id: true },
    });

    if (!request) {
      return { success: false, error: 'Demande introuvable' };
    }

    const solution = await prisma.solution.create({
      data: {
        requestId: validated.requestId,
        partTemplateId: validated.partTemplateId,
        method: validated.method,
        confidence: validated.confidence,
        metadata: validated.metadata,
      },
    });

    revalidatePath(`/admin/demandes/${validated.requestId}`);

    return { success: true, data: solution };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Données invalides' };
    }
    console.error('Error creating solution:', error);
    return { success: false, error: (error as Error)?.message || 'Échec de la création' };
  }
}

export async function validateSolution(
  input: z.infer<typeof ValidateSolutionSchema>,
): Promise<{ success: true; data: Solution } | { success: false; error: string }> {
  try {
    const validated = ValidateSolutionSchema.parse(input);
    const validatedAt = validated.validatedAt ? new Date(validated.validatedAt) : new Date();

    const solution = await prisma.solution.update({
      where: { id: validated.id },
      data: { validatedAt },
    });

    revalidatePath(`/admin/demandes/${solution.requestId}`);

    return { success: true, data: solution };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Données invalides' };
    }
    console.error('Error validating solution:', error);
    return { success: false, error: (error as Error)?.message || 'Échec de la validation' };
  }
}

export async function linkSolutionToTemplate(
  input: z.infer<typeof LinkSolutionToTemplateSchema>,
): Promise<{ success: true; data: Solution } | { success: false; error: string }> {
  try {
    const validated = LinkSolutionToTemplateSchema.parse(input);

    const solution = await prisma.solution.update({
      where: { id: validated.solutionId },
      data: { partTemplateId: validated.partTemplateId },
    });

    revalidatePath(`/admin/demandes/${solution.requestId}`);

    return { success: true, data: solution };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Données invalides' };
    }
    console.error('Error linking solution to template:', error);
    return { success: false, error: (error as Error)?.message || 'Échec de la liaison' };
  }
}

export type SolutionWithTemplate = Prisma.SolutionGetPayload<{
  include: { partTemplate: true };
}>;

export async function listSolutionsByRequest(requestId: string): Promise<SolutionWithTemplate[]> {
  try {
    const validatedId = z.string().cuid().parse(requestId);

    return await prisma.solution.findMany({
      where: { requestId: validatedId },
      include: { partTemplate: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error listing solutions by request:', error);
    return [];
  }
}
