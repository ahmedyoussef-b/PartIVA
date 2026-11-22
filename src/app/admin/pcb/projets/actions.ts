'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

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
