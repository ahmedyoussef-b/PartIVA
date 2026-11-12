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
  partId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
});

const UpdateREProjectStatusSchema = z.object({
  id: z.string().cuid(),
  status: ProjectStatusSchema,
});

const AddREStepSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().min(1, "Le nom de l'étape est requis"),
  description: z.string().optional(),
  order: z.number().int().min(0),
});

const UpdateREStepSchema = z.object({
  stepId: z.string().cuid(),
  completed: z.boolean().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const AddCadFileSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().min(1, 'Le nom du fichier est requis'),
  url: z.string().url('URL invalide'),
  fileType: z.enum(['IMAGE', 'PDF', 'CAD_STL', 'CAD_STEP', 'CAD_OBJ', 'OTHER']),
  sizeBytes: z.number().int().nonnegative().optional(),
});

export async function createREProject(
  input: z.infer<typeof CreateREProjectSchema>,
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

    console.info('[RE:project] Projet créé', { projectId: project.id, name: validated.name });
    return { success: true, data: project };
  } catch (error) {
    console.error('Error creating RE project:', error);
    return { success: false, error: 'Erreur lors de la création du projet RE' };
  }
}

const CreateREProjectFromRequestSchema = z.object({
  requestId: z.string().cuid(),
});

export async function createREProjectFromRequest(
  requestId: string,
): Promise<{ success: true; projectId: string } | { success: false; error: string }> {
  try {
    const validated = CreateREProjectFromRequestSchema.parse({ requestId });

    const existingRequest = await prisma.request.findUnique({
      where: { id: validated.requestId },
      select: {
        id: true,
        partDescription: true,
        projects: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!existingRequest) {
      return { success: false, error: 'Demande introuvable' };
    }

    if (existingRequest.projects.length > 0) {
      return { success: true, projectId: existingRequest.projects[0]!.id };
    }

    const project = await prisma.reverseEngineeringProject.create({
      data: {
        name: `RE - ${existingRequest.partDescription}`,
        description: `Projet de reverse engineering généré à partir de la demande ${validated.requestId}`,
        status: 'DRAFT',
        requests: {
          connect: { id: validated.requestId },
        },
      },
      select: { id: true },
    });

    revalidatePath('/admin/reverse-engineering');
    revalidatePath('/admin/reverse-engineering/[id]');

    console.info('[RE:project] Projet créé depuis demande', { projectId: project.id, requestId });
    return { success: true, projectId: project.id };
  } catch (error) {
    console.error('Error creating RE project from request:', error);
    return { success: false, error: 'Erreur lors de la création du projet RE depuis la demande' };
  }
}

const CreateREProjectFromFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  status: ProjectStatusSchema.default('DRAFT'),
});

export async function createREProjectFromForm(
  prevState: { success?: boolean; error?: string; projectId?: string } | null,
  formData: FormData,
): Promise<{ success: boolean; error?: string; projectId?: string }> {
  'use server';

  const name = formData.get('name') as string;
  const description = formData.get('description') as string | undefined;
  const status = formData.get('status') as string | undefined;

  const validated = CreateREProjectFromFormSchema.safeParse({ name, description, status });
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message || 'Données invalides' };
  }

  const result = await createREProject(validated.data);

  if (result.success) {
    return { success: true, projectId: result.data.id };
  }
  return { success: false, error: result.error };
}

export async function updateREProjectStatus(
  input: z.infer<typeof UpdateREProjectStatusSchema>,
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

    console.info('[RE:status] Statut mis à jour', {
      projectId: input.id,
      status: validated.status,
    });

    return { success: true, data: project };
  } catch (error) {
    console.error('Error updating RE project status:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du statut' };
  }
}

export async function addREStep(
  input: z.infer<typeof AddREStepSchema>,
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

    console.info('[RE:step] Étape ajoutée', {
      projectId: validated.projectId,
      stepName: validated.name,
    });

    return { success: true, data: step };
  } catch (error) {
    console.error('Error adding RE step:', error);
    return { success: false, error: "Erreur lors de l'ajout de l'étape" };
  }
}

export async function updateREStep(
  input: z.infer<typeof UpdateREStepSchema>,
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
    return { success: false, error: "Erreur lors de la mise à jour de l'étape" };
  }
}

export async function addCadFile(
  input: z.infer<typeof AddCadFileSchema>,
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

    console.info('[RE:upload] Fichier CAO ajouté en base', {
      projectId: validated.projectId,
      fileName: validated.name,
    });

    return { success: true, data: cadFile };
  } catch (error) {
    console.error('Error adding CAD file:', error);
    return { success: false, error: "Erreur lors de l'ajout du fichier CAO" };
  }
}

import { getCurrentUser } from '@/lib/auth-server';
import { runEngine } from '@/core/ai-engine/engine';
import type { IngestInput } from '@/core/ai-engine/skills/ingest/types';
import { getReverseEngineeringProjectById } from '@/lib/data/reverse-engineering';
export async function analyzeReverseEngineeringProject(projectId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as unknown as { role: string }).role !== 'ADMIN') {
      return { ok: false as const, error: 'UNAUTHORIZED' };
    }
    const project = await getReverseEngineeringProjectById(projectId);
    if (!project) {
      return { ok: false as const, error: 'PROJECT_NOT_FOUND' };
    }
    const cadFiles = (project as unknown as { cadFiles: unknown[] }).cadFiles ?? [];
    const input: IngestInput = {
      cadFiles: cadFiles.map((f) => (f as { url: string }).url),
      description: project.description || project.name,
    };
    const result = await runEngine(input, { mode: 'deep' });
    return {
      ok: true as const,
      result: {
        candidatesCount: result.search.candidates.length,
        bestCandidate: result.search.candidates[0] ?? null,
        searchStatus: result.search.searchStatus,
        reconstructStatus: result.reconstruct.reconstructStatus,
        reconstructMethod: result.reconstruct.candidates[0]?.method ?? 'unknown',
        archiveStatus: result.archive.archiveStatus,
        archivedPartId: result.archive.archivedPartId,
        warnings: result.archive.warnings,
      },
    };
  } catch (e) {
    return { ok: false as const, error: String(e) };
  }
}
