'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { CreateRequestSchema, RequestStatusSchema, RequestUrgencySchema } from '@/schemas/request';
import type { Request } from '@/generated/prisma/client';

const PRISMA_STATUS_MAP: Record<string, Request['status']> = {
  new: 'PENDING',
  searching: 'REVIEW',
  candidate_found: 'ACCEPTED',
  reverse_engineering: 'IN_PROGRESS',
  validated: 'ACCEPTED',
  machining: 'IN_PROGRESS',
  completed: 'COMPLETED',
  archived: 'COMPLETED',
  rejected: 'REJECTED',
};

const PRISMA_URGENCY_MAP: Record<string, Request['urgency']> = {
  low: 'LOW',
  normal: 'MEDIUM',
  high: 'HIGH',
  critical: 'URGENT',
};

type CreateRequestInput = {
  client: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  machineRef?: string;
  partDescription: string;
  partFunction?: string;
  suspectedMaterial?: string;
  quantity: number;
  urgency: string;
  photos: (File | string)[];
};

export async function createRequest(
  input: CreateRequestInput
): Promise<{ success: true; data: Request } | { success: false; error: string }> {
  try {
    const validated = CreateRequestSchema.parse(input);

    let clientId: string | undefined;
    if (validated.client?.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.client.email },
        select: { id: true },
      });

      if (existingUser) {
        clientId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: validated.client.email,
            name: validated.client.name,
            role: 'USER',
            passwordHash: '$2b$10$placeholder.hash.for.dev.seed.only',
          },
          select: { id: true },
        });
        clientId = newUser.id;
      }
    }

    const photos = validated.photos?.map((file) => {
      if (typeof file === 'string') return file;
      if (file instanceof File) return URL.createObjectURL(file);
      return String(file);
    }) ?? [];

    const request = await prisma.request.create({
      data: {
        clientId,
        machineRef: validated.machineRef,
        partDescription: validated.partDescription,
        partFunction: validated.partFunction,
        suspectedMaterial: validated.suspectedMaterial,
        quantity: validated.quantity,
        urgency: PRISMA_URGENCY_MAP[validated.urgency] ?? 'MEDIUM',
        status: 'PENDING',
        photos,
      },
      include: {
        client: true,
        projects: true,
      },
    });

    revalidatePath('/admin/demandes');
    revalidatePath('/client/dashboard/demandes');
    revalidatePath('/demande');

    return { success: true, data: request };
  } catch (error) {
    console.error('Error creating request:', error);
    return { success: false, error: 'Erreur lors de la création de la demande' };
  }
}

type UpdateRequestStatusInput = {
  id: string;
  status: z.infer<typeof RequestStatusSchema>;
};

export async function updateRequestStatus(
  input: UpdateRequestStatusInput
): Promise<{ success: true; data: Request } | { success: false; error: string }> {
  try {
    const validated = RequestStatusSchema.parse(input.status);

    const request = await prisma.request.update({
      where: { id: input.id },
      data: { status: (PRISMA_STATUS_MAP[validated] ?? validated.toUpperCase()) as Request['status'] },
      include: {
        client: true,
        projects: true,
      },
    });

    revalidatePath('/admin/demandes');
    revalidatePath('/admin/demandes/[id]');
    revalidatePath('/client/dashboard/demandes');
    revalidatePath('/client/dashboard/demandes/[id]');

    return { success: true, data: request };
  } catch (error) {
    console.error('Error updating request status:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du statut' };
  }
}

type UpdateRequestUrgencyInput = {
  id: string;
  urgency: z.infer<typeof RequestUrgencySchema>;
};

export async function updateRequestUrgency(
  input: UpdateRequestUrgencyInput
): Promise<{ success: true; data: Request } | { success: false; error: string }> {
  try {
    const validated = RequestUrgencySchema.parse(input.urgency);

    const request = await prisma.request.update({
      where: { id: input.id },
      data: { urgency: (PRISMA_URGENCY_MAP[validated] ?? validated.toUpperCase()) as Request['urgency'] },
      include: {
        client: true,
        projects: true,
      },
    });

    revalidatePath('/admin/demandes');
    revalidatePath('/admin/demandes/[id]');
    revalidatePath('/client/dashboard/demandes');
    revalidatePath('/client/dashboard/demandes/[id]');

    return { success: true, data: request };
  } catch (error) {
    console.error('Error updating request urgency:', error);
    return { success: false, error: "Erreur lors de la mise à jour de l'urgence" };
  }
}
