'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ReverseEngineeringStep, CadFile } from '@/generated/prisma/client';
import type { REProjectWithRelations } from '@/lib/data/reverse-engineering';

const ProjectStatusSchema = z.enum(['DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED']);

const CreateREProjectSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  status: ProjectStatusSchema.default('DRAFT'),
  partId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

const UpdateREProjectStatusSchema = z.object({
  id: z.string().uuid(),
  status: ProjectStatusSchema,
});

const AddREStepSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, 'Le nom de l\'étape est requis'),
  description: z.string().optional(),
  order: z.number().int().min(0),
});

const UpdateREStepSchema = z.object({
  stepId: z.string().uuid(),
  completed: z.boolean().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const AddCadFileSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, 'Le nom du fichier est requis'),
  url: z.string().url('URL invalide'),
  fileType: z.enum(['IMAGE', 'PDF', 'CAD_STL', 'CAD_STEP', 'CAD_OBJ', 'OTHER']),
  sizeBytes: z.number().int().nonnegative().optional(),
});

export async function createREProject(
  input: z.infer<typeof CreateREProjectSchema>
): Promise<{ success: true; data: REProjectWithRelations } | { success: false; error: string }> {
  try {
    const validated = CreateREProjectSchema.parse(input);

    const project = await prisma.reverseEngineeringProject.create({
      data: {
        name: validated.name,
        description: validated.description,
        status: validated.status,
        partId: validated.partId,
        userId: validated.userId,
      },
      include: {
        part: true,
        user: { select: { id: true, name: true, email: true } },
        requests: true,
        steps: { orderBy: { order: 'asc' } },
        cadFiles: { orderBy: { createdAt: 'desc' } },
      },
    });

    revalidatePath('/admin/reverse-engineering');
    revalidatePath('/admin/reverse-engineering/[id]');

    return { success: true, data: project };
  } catch (error) {
    console.error('Error creating RE project:', error);
    return { success: false, error: 'Erreur lors de la création du projet RE' };
  }
}

export async function updateREProjectStatus(
  input: z.infer<typeof UpdateREProjectStatusSchema>
): Promise<{ success: true; data: REProjectWithRelations } | { success: false; error: string }> {
  try {
    const validated = UpdateREProjectStatusSchema.parse(input);

    const project = await prisma.reverseEngineeringProject.update({
      where: { id: input.id },
      data: { status: validated.status },
      include: {
        part: true,
        user: { select: { id: true, name: true, email: true } },
        requests: true,
        steps: { orderBy: { order: 'asc' } },
        cadFiles: { orderBy: { createdAt: 'desc' } },
      },
    });

    revalidatePath('/admin/reverse-engineering');
    revalidatePath('/admin/reverse-engineering/[id]');

    return { success: true, data: project };
  } catch (error) {
    console.error('Error updating RE project status:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du statut' };
  }
}

export async function addREStep(
  input: z.infer<typeof AddREStepSchema>
): Promise<{ success: true; data: ReverseEngineeringStep } | { success: false; error: string }> {
  try {
    const validated = AddREStepSchema.parse(input);

    const project = await prisma.reverseEngineeringProject.findUnique({
      where: { id: validated.projectId },
      select: { id: true },
    });

    if (!project) {
      return { success: false, error: 'Projet RE introuvable' };
    }

    const step = await prisma.reverseEngineeringStep.create({
      data: {
        projectId: validated.projectId,
        name: validated.name,
        description: validated.description,
        order: validated.order,
      },
    });

    revalidatePath('/admin/reverse-engineering/[id]');

    return { success: true, data: step };
  } catch (error) {
    console.error('Error adding RE step:', error);
    return { success: false, error: 'Erreur lors de l\'ajout de l\'étape' };
  }
}

export async function updateREStep(
  input: z.infer<typeof UpdateREStepSchema>
): Promise<{ success: true; data: ReverseEngineeringStep } | { success: false; error: string }> {
  try {
    const validated = UpdateREStepSchema.parse(input);

    const step = await prisma.reverseEngineeringStep.update({
      where: { id: validated.stepId },
      data: {
        ...(validated.completed !== undefined ? { completed: validated.completed } : {}),
        ...(validated.name !== undefined ? { name: validated.name } : {}),
        ...(validated.description !== undefined ? { description: validated.description } : {}),
      },
    });

    revalidatePath('/admin/reverse-engineering/[id]');

    return { success: true, data: step };
  } catch (error) {
    console.error('Error updating RE step:', error);
    return { success: false, error: 'Erreur lors de la mise à jour de l\'étape' };
  }
}

export async function addCadFile(
  input: z.infer<typeof AddCadFileSchema>
): Promise<{ success: true; data: CadFile } | { success: false; error: string }> {
  try {
    const validated = AddCadFileSchema.parse(input);

    const project = await prisma.reverseEngineeringProject.findUnique({
      where: { id: validated.projectId },
      select: { id: true },
    });

    if (!project) {
      return { success: false, error: 'Projet RE introuvable' };
    }

    const cadFile = await prisma.cadFile.create({
      data: {
        projectId: validated.projectId,
        name: validated.name,
        url: validated.url,
        fileType: validated.fileType,
        sizeBytes: validated.sizeBytes,
      },
    });

    revalidatePath('/admin/reverse-engineering/[id]');

    return { success: true, data: cadFile };
  } catch (error) {
    console.error('Error adding CAD file:', error);
    return { success: false, error: 'Erreur lors de l\'ajout du fichier CAO' };
  }
}
