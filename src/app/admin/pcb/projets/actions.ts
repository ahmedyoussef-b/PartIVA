'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-admin';

/** Supprime un brouillon sans composants (anciens projets vides/tests). */
export async function supprimerProjetBrouillon(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return;
  }
  const projectId = String(formData.get('projectId') || '');
  if (!projectId) return;
  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: { status: true, _count: { select: { components: true } } },
  });
  if (!project || !['draft', 'in_progress'].includes(project.status)) return;
  if (project._count.components > 0) return; // ne jamais supprimer de vrai travail
  await prisma.pcbProject.delete({ where: { id: projectId } });
  console.info('[PCB:PROJETS] Brouillon supprimé', { projectId });
  revalidatePath('/admin/pcb/projets');
}

export async function concevoirDepuisDemande(formData: FormData) {
  const requestId = String(formData.get('requestId') || '');
  if (!requestId) return;

  console.info('[PCB:PROJETS] Lancement de la conception depuis une demande client', { requestId });

  const existing = await prisma.pcbProject.findFirst({ where: { requestId } });
  if (existing) {
    revalidatePath('/admin/pcb/projets');
    redirect(`/admin/pcb/${existing.id}`);
  }

  const req = await prisma.request.findUnique({
    where: { id: requestId },
    select: { partDescription: true },
  });

  const project = await prisma.pcbProject.create({
    data: {
      name: `PCB — ${(req?.partDescription || requestId.slice(0, 8)).slice(0, 50)}`,
      status: 'draft',
      requestId,
    },
  });

  revalidatePath('/admin/pcb/projets');
  redirect(`/admin/pcb/${project.id}`);
}
