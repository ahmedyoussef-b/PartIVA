'use server';

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { uploadToCloudinary, UploadError } from '@/lib/upload';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from '@/schemas/part';
import { Prisma } from '@/generated/prisma/client';

const CreatePartSchema = z.object({
  partNumber: z.string().min(1, 'Numéro de pièce requis'),
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  description: z.string().optional(),
});

const UpdatePartSchema = z.object({
  partId: z.string().min(1),
  name: z.string().min(3).optional(),
  material: z.string().optional(),
  description: z.string().optional(),
  ptvReference: z.string().optional(),
  partNumber: z.string().optional(),
});

export async function updatePart(data: {
  partId: string;
  name?: string;
  material?: string;
  description?: string;
  ptvReference?: string;
  partNumber?: string;
}): Promise<{ success: true; updatedAt: string } | { success: false; error: string }> {
  console.log('[ADMIN-EDIT-PART-SERVER] Mise à jour demandée:', { partId: data.partId, data });

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Accès non autorisé' };
    }

    const validated = UpdatePartSchema.parse(data);
    console.log('[ADMIN-EDIT-PART-SERVER] Mise à jour Prisma:', {
      partId: validated.partId,
      data: validated,
    });

    const updated = await prisma.part.update({
      where: { id: validated.partId },
      data: {
        ...(validated.name !== undefined ? { name: validated.name } : {}),
        ...(validated.material !== undefined ? { material: validated.material } : {}),
        ...(validated.description !== undefined ? { description: validated.description } : {}),
        ...(validated.ptvReference !== undefined ? { ptvReference: validated.ptvReference } : {}),
        ...(validated.partNumber !== undefined ? { partNumber: validated.partNumber } : {}),
      },
    });

    console.log('[ADMIN-EDIT-PART-SERVER] Mise à jour réussie:', {
      partId: updated.id,
      updatedAt: updated.updatedAt,
    });
    return { success: true, updatedAt: updated.updatedAt.toISOString() };
  } catch (error) {
    console.error('[ADMIN-EDIT-PART-ERROR] Mise à jour échouée:', error);
    return { success: false, error: (error as Error)?.message || 'Erreur inconnue' };
  }
}

export async function createPart(
  formData: FormData,
): Promise<{ success: true; partId: string } | { success: false; error: string }> {
  console.log('[ADMIN-CREATE-PART] Début');

  try {
    // 1. Récupération des champs texte
    const partNumber = formData.get('partNumber');
    const name = formData.get('name');
    const description = formData.get('description');

    // 2. Validation Zod
    const validated = CreatePartSchema.parse({
      partNumber,
      name,
      description,
    });

    // 3. Vérification session admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Accès non autorisé' };
    }

    // 4. Filtrage des images
    const rawImages = formData.getAll('images') as File[];
    const imageTags = formData.getAll('imageTags') as string[];
    const validImages = rawImages.filter((img) => img && img.size > 0 && img.name);

    // 5. Exécution dans une transaction Prisma pour garantir l'atomicité
    const createdPart = await prisma.$transaction(async (tx) => {
      // 5a. Création de la pièce
      const part = await tx.part.create({
        data: {
          partNumber: validated.partNumber,
          name: validated.name,
          description: validated.description || '',
          status: 'DRAFT',
          clientId: session.user.id,
        },
      });

      // 5b. Upload et association de chaque image
      for (let i = 0; i < validImages.length; i++) {
        const image = validImages[i];
        if (!image) {
          continue;
        }
        const tag = imageTags[i] || "Vue d'ensemble";

        console.log(`[ADMIN-CREATE-PART] Upload image ${i + 1}/${validImages.length}`);

        // Validation MIME type
        const mimeType = image.type;
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as never)) {
          throw new Error(`Type MIME non autorisé: ${mimeType}`);
        }

        // Validation taille (max 5 Mo)
        if (image.size > MAX_IMAGE_SIZE_BYTES) {
          throw new Error(
            `Image trop volumineuse: ${image.name} (${image.size} octets, max ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024} Mo)`,
          );
        }

        const buffer = Buffer.from(await image.arrayBuffer());
        const uploaded = await uploadToCloudinary(buffer, `parts/${part.id}`, 'image', mimeType);

        await tx.partImage.create({
          data: {
            partId: part.id,
            url: uploaded.url,
            publicId: uploaded.publicId,
            altText: image.name,
            caption: tag,
            order: i,
            isPrimary: i === 0,
          },
        });
      }

      return part;
    });

    console.log('[ADMIN-CREATE-PART] ✅ Pièce créée:', {
      id: createdPart.id,
      partNumber: createdPart.partNumber,
    });

    return { success: true, partId: createdPart.id };
  } catch (error) {
    console.error('[ADMIN-CREATE-PART-ERROR] ❌ Rollback:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[] | undefined)?.join(', ') || 'partNumber';
      return {
        success: false,
        error: `Le numéro de pièce existe déjà (${target}). Veuillez utiliser un numéro unique.`,
      };
    }

    if (error instanceof z.ZodError) {
      const zodErr = error as unknown as {
        errors: Array<{ path: Array<string | number>; message: string }>;
      };
      return {
        success: false,
        error: `Validation: ${zodErr.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`,
      };
    }

    if (error instanceof UploadError) {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: (error as Error)?.message || 'Erreur lors de la création de la pièce',
    };
  }
}

export async function addPartImage(formData: FormData): Promise<
  | {
      success: true;
      image: {
        id: string;
        url: string;
        altText: string | null;
        caption: string | null;
        order: number;
      };
    }
  | { success: false; error: string }
> {
  const file = formData.get('file') as File;
  const partId = formData.get('partId') as string;
  const caption = (formData.get('caption') as string) || "Vue d'ensemble";

  console.log('[ADMIN-IMAGE-UPLOAD] Upload: { fileName, status }', {
    fileName: file?.name,
    status: 'starting',
    partId,
  });

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Accès non autorisé' };
    }

    if (!partId || !file) {
      return { success: false, error: 'Fichier ou identifiant de pièce manquant' };
    }

    const mimeType = file.type;
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as never)) {
      return { success: false, error: `Type MIME non autorisé: ${mimeType}` };
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        success: false,
        error: `Image trop volumineuse (max ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024} Mo)`,
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadToCloudinary(buffer, `parts/${partId}`, 'image', mimeType);

    const imageCount = await prisma.partImage.count({ where: { partId } });

    const newImage = await prisma.partImage.create({
      data: {
        partId,
        url: uploaded.url,
        publicId: uploaded.publicId,
        altText: file.name,
        caption,
        order: imageCount,
        isPrimary: imageCount === 0,
      },
    });

    console.log('[ADMIN-IMAGE-UPLOAD] ✅ Image ajoutée:', {
      id: newImage.id,
      partId,
      url: newImage.url,
    });

    return {
      success: true,
      image: {
        id: newImage.id,
        url: newImage.url,
        altText: newImage.altText,
        caption: newImage.caption,
        order: newImage.order,
      },
    };
  } catch (error) {
    console.error('[ADMIN-IMAGE-UPLOAD-ERROR] ❌ Échec ajout image:', error);
    return {
      success: false,
      error: (error as Error)?.message || "Échec de l'upload de l'image",
    };
  }
}

export async function deletePartImage(data: {
  partId: string;
  imageId: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  console.log('[ADMIN-IMAGE-DELETE] Suppression demandée: { partId, imageId }', {
    partId: data.partId,
    imageId: data.imageId,
  });

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Accès non autorisé' };
    }

    if (!data.partId || !data.imageId) {
      return { success: false, error: 'Identifiant manquant' };
    }

    const image = await prisma.partImage.findFirst({
      where: { id: data.imageId, partId: data.partId },
      select: { id: true, publicId: true, isPrimary: true },
    });

    if (!image) {
      return { success: false, error: 'Image introuvable' };
    }

    await prisma.partImage.delete({ where: { id: data.imageId } });

    if (image.isPrimary) {
      const next = await prisma.partImage.findFirst({
        where: { partId: data.partId },
        orderBy: { order: 'asc' },
        select: { id: true },
      });
      if (next) {
        await prisma.partImage.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }

    console.log('[ADMIN-IMAGE-DELETE] ✅ Image supprimée:', {
      partId: data.partId,
      imageId: data.imageId,
    });

    return { success: true };
  } catch (error) {
    console.error('[ADMIN-IMAGE-DELETE-ERROR] ❌ Erreur suppression:', error);
    return {
      success: false,
      error: (error as Error)?.message || "Erreur lors de la suppression de l'image",
    };
  }
}
