'use server';

const DEBUG_PREFIX = '[DEBUG-ACTION-CREATE-REQUEST]';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { CreateRequestSchema, RequestStatusSchema, RequestUrgencySchema } from '@/schemas/request';
import type { Request } from '@/generated/prisma/client';
import { uploadToCloudinary } from '@/lib/upload';

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
export async function createRequest(
  input: FormData,
): Promise<{ success: true; data: Request } | { success: false; error: string }> {
  console.log(`${DEBUG_PREFIX} === DÉBUT ACTION SERVEUR ===`);

  try {
    // Extraction des champs texte du FormData
    const clientName = input.get('clientName') as string;
    const clientEmail = input.get('clientEmail') as string;
    const machineRef = input.get('machineRef') as string;
    const partName = input.get('partName') as string;
    const material = input.get('material') as string;
    const quantity = parseInt(input.get('quantity') as string || '1', 10) || 1;
    const urgency = input.get('urgency') as string;
    const notes = input.get('notes') as string;

    // Extraction des fichiers photo et de leurs tags
    const photoFiles = input.getAll('photos') as File[];
    const photoTags = input.getAll('photoTags') as string[];

    // ⭐ NOUVELLE LOGIQUE : Upload des photos directement vers Cloudinary
    const uploadedPhotoUrls: string[] = [];
    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      const tag = photoTags[i] || 'Vue d\'ensemble';

      if (!file.type.startsWith('image/')) {
        console.warn(`${DEBUG_PREFIX} ⚠️ Type MIME non autorisé: ${file.type}`);
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await uploadToCloudinary(buffer, `requests/temp-${Date.now()}`, 'image', file.type);
        uploadedPhotoUrls.push(uploaded.url);
        console.log(`${DEBUG_PREFIX} ✅ Image ${i + 1}:`, uploaded.url);
      } catch (uploadErr) {
        console.error(`${DEBUG_PREFIX} ❌ Échec image ${i + 1}:`, uploadErr);
      }
    }

    if (uploadedPhotoUrls.length === 0) {
      return {
        success: false,
        error: 'Aucune photo valide.',
      };
    }

    console.log(`${DEBUG_PREFIX} Validation Zod...`);
    const validated = CreateRequestSchema.parse({
      client: {
        name: clientName,
        email: clientEmail,
      },
      machineRef: machineRef || undefined,
      partDescription: partName,
      partFunction: notes || undefined,
      suspectedMaterial: material,
      quantity,
      urgency,
      photos: uploadedPhotoUrls,
    });

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
      console.log(`${DEBUG_PREFIX} Session utilisateur...`);
      console.log(`${DEBUG_PREFIX} Email:`, validated.client.email);
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.client.email },
        select: { id: true },
      });

      if (existingUser) {
        clientId = existingUser.id;
        console.log(`${DEBUG_PREFIX} Utilisateur existant: userId=${clientId}`);
      } else {
        console.log(`${DEBUG_PREFIX} Création nouvel utilisateur...`);
        const newUser = await prisma.user.create({
          data: {
            email: validated.client.email,
            name: validated.client.name,
            role: 'USER',
          },
          select: { id: true },
        });
        clientId = newUser.id;
        console.log(`${DEBUG_PREFIX} Nouvel utilisateur: userId=${clientId}`);
      }
    } else {
      console.log(`${DEBUG_PREFIX} Pas d'email client`);
    }

    console.log(`${DEBUG_PREFIX} Photos: ${uploadedPhotoUrls.length}`);

    console.log(`${DEBUG_PREFIX} Création Prisma...`);
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
        photos: uploadedPhotoUrls,
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
    console.error(`${DEBUG_PREFIX} Erreur:`, error instanceof Error ? error.message : String(error));
    console.error(`${DEBUG_PREFIX} Stack:`, error instanceof Error ? error.stack : undefined);

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

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

const PRISMA_STATUS_MAP: Record<string, Request['status']> = {
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
    // Les photos sont déjà des URLs Cloudinary (chaînes de caractères)
    const photos = validated.photos ?? [];
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
