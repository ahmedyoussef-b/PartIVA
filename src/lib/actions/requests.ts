'use server';

const DEBUG_PREFIX = '[DEBUG-ACTION-CREATE-REQUEST]';

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
  input: CreateRequestInput,
): Promise<{ success: true; data: Request } | { success: false; error: string }> {
  console.log(`${DEBUG_PREFIX} === DÉBUT ACTION SERVEUR ===`);
  console.log(`${DEBUG_PREFIX} Données reçues:`, {
    hasClient: !!input.client,
    clientEmail: input.client?.email,
    clientName: input.client?.name,
    machineRef: input.machineRef,
    partDescriptionLength: input.partDescription?.length,
    partFunction: input.partFunction,
    suspectedMaterial: input.suspectedMaterial,
    quantity: input.quantity,
    urgency: input.urgency,
    photosCount: input.photos?.length,
  });

  try {
    console.log(`${DEBUG_PREFIX} Étape 1: Validation Zod...`);
    const validated = CreateRequestSchema.parse(input);
    console.log(`${DEBUG_PREFIX} Données validées:`, {
      clientEmail: validated.client?.email,
      machineRef: validated.machineRef,
      partDescriptionLength: validated.partDescription?.length,
      quantity: validated.quantity,
      urgency: validated.urgency,
      photosCount: validated.photos?.length,
    });

    let clientId: string | undefined;
    if (validated.client?.email) {
      console.log(`${DEBUG_PREFIX} Étape 2: Récupération session (recherche utilisateur)...`);
      console.log(`${DEBUG_PREFIX} Email recherché:`, validated.client.email);
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.client.email },
        select: { id: true },
      });

      if (existingUser) {
        clientId = existingUser.id;
        console.log(`${DEBUG_PREFIX} Utilisateur existant trouvé: userId=${clientId}`);
      } else {
        console.log(`${DEBUG_PREFIX} Utilisateur non trouvé, création d'un nouvel utilisateur...`);
        const newUser = await prisma.user.create({
          data: {
            email: validated.client.email,
            name: validated.client.name,
            role: 'USER',
          },
          select: { id: true },
        });
        clientId = newUser.id;
        console.log(`${DEBUG_PREFIX} Nouvel utilisateur créé: userId=${clientId}`);
      }
    } else {
      console.log(`${DEBUG_PREFIX} Étape 2: Aucun email client, clientId rester undefined`);
    }

    console.log(`${DEBUG_PREFIX} Étape 3: Mapping des photos...`);
    const photos =
      validated.photos?.map((file) => {
        if (typeof file === 'string') return file;
        if (file instanceof File) return URL.createObjectURL(file);
        return String(file);
      }) ?? [];
    console.log(`${DEBUG_PREFIX} Photos mappées:`, photos.length, 'éléments');

    console.log(`${DEBUG_PREFIX} Étape 4: Création Prisma (prisma.request.create)...`);
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
    console.log(`${DEBUG_PREFIX} ✅ Demande créée:`, {
      id: request.id,
      status: request.status,
      clientId: request.clientId,
    });

    revalidatePath('/admin/demandes');
    revalidatePath('/client/dashboard/demandes');
    revalidatePath('/demande');

    console.log(`${DEBUG_PREFIX} === FIN ACTION SERVEUR (SUCCÈS) ===`);
    return { success: true, data: request };
  } catch (error) {
    console.error(`${DEBUG_PREFIX} 💥 EXCEPTION:`, error);
    console.error(
      `${DEBUG_PREFIX} Error name:`,
      error instanceof Error ? error.name : typeof error,
    );
    console.error(
      `${DEBUG_PREFIX} Error message:`,
      error instanceof Error ? error.message : String(error),
    );
    console.error(`${DEBUG_PREFIX} Error stack:`, error instanceof Error ? error.stack : undefined);

    if (error && typeof error === 'object' && 'errors' in error) {
      const zodErr = error as { errors: Array<{ path: Array<string | number>; message: string }> };
      console.error(`${DEBUG_PREFIX} Erreur validation Zod:`, zodErr.errors);
      return {
        success: false,
        error: `Validation: ${zodErr.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      };
    }

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
    ) {
      console.error(`${DEBUG_PREFIX} Erreur Prisma code:`, (error as { code: string }).code);
      return {
        success: false,
        error: `Base de données (code ${(error as { code: string }).code}): ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Retourne le message d'erreur exact au client pour debug
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

type UpdateRequestStatusInput = {
  id: string;
  status: z.infer<typeof RequestStatusSchema>;
};

export async function updateRequestStatus(
  input: UpdateRequestStatusInput,
): Promise<{ success: true; data: Request } | { success: false; error: string }> {
  try {
    const validated = RequestStatusSchema.parse(input.status);

    const request = await prisma.request.update({
      where: { id: input.id },
      data: {
        status: (PRISMA_STATUS_MAP[validated] ?? validated.toUpperCase()) as Request['status'],
      },
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
  input: UpdateRequestUrgencyInput,
): Promise<{ success: true; data: Request } | { success: false; error: string }> {
  try {
    const validated = RequestUrgencySchema.parse(input.urgency);

    const request = await prisma.request.update({
      where: { id: input.id },
      data: {
        urgency: (PRISMA_URGENCY_MAP[validated] ?? validated.toUpperCase()) as Request['urgency'],
      },
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
