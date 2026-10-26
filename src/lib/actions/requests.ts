'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { CreateRequestSchema, RequestStatusSchema, RequestUrgencySchema } from '@/schemas/request';
import type { Request } from '@/generated/prisma/client';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/upload'; // Assure-toi que ce chemin est correct

const DEBUG_PREFIX = '[DEBUG-ACTION-CREATE-REQUEST]';

// Mappings Enums Prisma <-> Zod/String
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
    // 1. Extraction des champs texte
    const clientName = input.get('clientName') as string;
    const clientEmail = input.get('clientEmail') as string;
    const machineRef = input.get('machineRef') as string;
    const partName = input.get('partName') as string;
    const material = input.get('material') as string;
    const quantity = parseInt((input.get('quantity') as string) || '1', 10) || 1;
    const urgency = input.get('urgency') as string;
    const notes = input.get('notes') as string;

    // 2. Extraction des fichiers photo
    const rawPhotos = input.getAll('photos');

    // 3. ⭐ Upload direct vers Cloudinary (Côté Serveur) - VERSION SÉCURISÉE
    const uploadedPhotoUrls: string[] = [];

    // Récupération sécurisée des fichiers
    if (!rawPhotos || rawPhotos.length === 0) {
      return { success: false, error: 'Aucune photo fournie.' };
    }

    for (let i = 0; i < rawPhotos.length; i++) {
      const item = rawPhotos[i];

      // Si c'est déjà une URL (string), l'utiliser directement (widget Cloudinary côté client)
      if (typeof item === 'string' && item.startsWith('http')) {
        uploadedPhotoUrls.push(item);
        console.log(`${DEBUG_PREFIX} ✅ URL photo ${i + 1} conservée:`, item);
        continue;
      }

      // Vérification stricte que c'est bien un File
      if (!(item instanceof File)) {
        console.warn(`${DEBUG_PREFIX} ⚠️ Ignoré (pas un fichier):`, item);
        continue;
      }

      const file = item as File; // Cast sécurisé après vérification

      // Validation MIME basique côté serveur aussi
      if (!file.type.startsWith('image/')) {
        console.warn(`${DEBUG_PREFIX} ⚠️ Ignoré (non-image): ${file.name}`);
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        // Dossier temporaire ou spécifique aux demandes
        const folder = `partiva/requests/${Date.now()}`;
        const uploaded = await uploadToCloudinary(buffer, folder, 'image', file.type);

        if (uploaded?.url) {
          uploadedPhotoUrls.push(uploaded.url);
          console.log(`${DEBUG_PREFIX} ✅ Image ${i + 1} uploadée:`, uploaded.url);
        } else {
          throw new Error('Réponse Cloudinary invalide');
        }
      } catch (uploadErr) {
        console.error(`${DEBUG_PREFIX} ❌ Échec upload image ${i + 1}:`, uploadErr);
        // On ne bloque pas toute la demande si une seule image échoue, mais on logge
      }
    }

    if (uploadedPhotoUrls.length === 0) {
      return { success: false, error: "Échec total de l'upload des photos." };
    }

    // 4. Préparation des données pour Zod
    const payloadForZod = {
      client: {
        name: clientName || 'Client Anonyme',
        email: clientEmail || '',
      },
      machineRef: machineRef || undefined,
      partDescription: partName,
      partFunction: notes || undefined,
      suspectedMaterial: material,
      quantity,
      urgency,
      photos: uploadedPhotoUrls, // URLs persistantes
    };

    console.log(`${DEBUG_PREFIX} Validation Zod...`);
    const validated = CreateRequestSchema.parse(payloadForZod);

    // 5. Résolution Client ID
    let clientId: string | undefined;

    // Essayer d'abord via Session (si connecté)
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      clientId = session.user.id;
      console.log(`${DEBUG_PREFIX} Utilisateur connecté: userId=${clientId}`);
    }
    // Sinon, chercher/créer via Email fourni dans le formulaire
    else if (validated.client?.email) {
      console.log(`${DEBUG_PREFIX} Recherche utilisateur par email:`, validated.client.email);
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.client.email },
        select: { id: true },
      });

      if (existingUser) {
        clientId = existingUser.id;
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
      }
    }

    // 6. Création de la Demande en Base
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
        photos: validated.photos, // Tableau d'URLs strings
      },
      include: {
        client: true,
        projects: true,
      },
    });

    console.log(`${DEBUG_PREFIX} ✅ Demande créée:`, { id: request.id, status: request.status });

    // 7. Revalidation Cache Next.js
    revalidatePath('/admin/demandes');
    revalidatePath('/client/dashboard/demandes');
    revalidatePath('/demande');

    return { success: true, data: request };
  } catch (error) {
    console.error(`${DEBUG_PREFIX} 💥 EXCEPTION GLOBALE:`, error);

    // Gestion Zod - Compatible Zod v3/v4
    if (error instanceof z.ZodError) {
      // error.issues est la propriété standard contenant les détails
      const details = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return {
        success: false,
        error: `Validation: ${details}`,
      };
    }

    // Gestion Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaErr = error as { code: string; meta?: unknown };
      if (prismaErr.code === 'P2002') {
        return { success: false, error: 'Doublon détecté en base de données.' };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur interne serveur',
    };
  }
}

// --- Fonctions utilitaires restantes (Update Status/Urgency) ---

type UpdateRequestStatusInput = {
  id: string;
  status: z.infer<typeof RequestStatusSchema>;
};

export async function updateRequestStatus(
  input: UpdateRequestStatusInput,
): Promise<{ success: boolean; data?: Request; error?: string }> {
  try {
    const validated = RequestStatusSchema.parse(input.status);
    const dbStatus = PRISMA_STATUS_MAP[validated] ?? (validated.toUpperCase() as Request['status']);

    const request = await prisma.request.update({
      where: { id: input.id },
      data: { status: dbStatus },
      include: { client: true, projects: true },
    });

    revalidatePath('/admin/demandes');
    revalidatePath(`/admin/demandes/[id]`);
    revalidatePath('/client/dashboard/demandes');

    return { success: true, data: request };
  } catch (error) {
    console.error('Error updating status:', error);
    return { success: false, error: 'Échec mise à jour statut' };
  }
}

type UpdateRequestUrgencyInput = {
  id: string;
  urgency: z.infer<typeof RequestUrgencySchema>;
};

export async function updateRequestUrgency(
  input: UpdateRequestUrgencyInput,
): Promise<{ success: boolean; data?: Request; error?: string }> {
  try {
    const validated = RequestUrgencySchema.parse(input.urgency);
    const dbUrgency =
      PRISMA_URGENCY_MAP[validated] ?? (validated.toUpperCase() as Request['urgency']);

    const request = await prisma.request.update({
      where: { id: input.id },
      data: { urgency: dbUrgency },
      include: { client: true, projects: true },
    });

    revalidatePath('/admin/demandes');
    revalidatePath(`/admin/demandes/[id]`);

    return { success: true, data: request };
  } catch (error) {
    console.error('Error updating urgency:', error);
    return { success: false, error: 'Échec mise à jour urgence' };
  }
}
