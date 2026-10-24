'use server';

const DEBUG_PREFIX = '[DEBUG-ACTION-CREATE-PART]';

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { uploadToCloudinary, UploadError } from '@/lib/upload';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from '@/schemas/part';

const CreatePartSchema = z.object({
  partNumber: z.string().min(1, 'Numéro de pièce requis'),
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  description: z.string().optional(),
});

export async function createPart(
  formData: FormData,
): Promise<{ success: true; partId: string } | { success: false; error: string }> {
  console.log(`${DEBUG_PREFIX} === DÉBUT ACTION SERVEUR ===`);

  try {
    // 1. Récupération des champs texte
    const partNumber = formData.get('partNumber');
    const name = formData.get('name');
    const description = formData.get('description');

    console.log(`${DEBUG_PREFIX} Données reçues:`, {
      partNumber,
      name,
      description,
    });

    // 2. Validation Zod
    const validated = CreatePartSchema.parse({
      partNumber,
      name,
      description,
    });
    console.log(`${DEBUG_PREFIX} Validation Zod OK`);

    // 3. Vérification session admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    console.log(`${DEBUG_PREFIX} Session:`, {
      userId: session?.user?.id,
      role: session?.user?.role,
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Accès non autorisé' };
    }

    // 4. Création de la pièce
    console.log(`${DEBUG_PREFIX} Création Prisma...`);
    const part = await prisma.part.create({
      data: {
        partNumber: validated.partNumber,
        name: validated.name,
        description: validated.description || '',
        status: 'DRAFT',
        clientId: session.user.id,
      },
    });
    console.log(`${DEBUG_PREFIX} Pièce créée:`, {
      id: part.id,
      partNumber: part.partNumber,
    });

    // 5. Upload des images (si présentes)
    const images = formData.getAll('images') as File[];
    const imageTags = formData.getAll('imageTags') as string[];

    console.log(`${DEBUG_PREFIX} Nombre d'images: ${images.length}`);

    if (images.length > 0) {
      console.log(`${DEBUG_PREFIX} Upload de ${images.length} image(s)...`);

      const failedUploads: { index: number; error: string; fileName: string }[] = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image) {
          continue;
        }
        const tag = imageTags[i] || "Vue d'ensemble";

        // Validation MIME type
        const mimeType = image.type;
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as never)) {
          const errorMsg = `Type MIME non autorisé: ${mimeType}`;
          console.error(`${DEBUG_PREFIX} ${errorMsg}`);
          failedUploads.push({ index: i, error: errorMsg, fileName: image.name });
          continue;
        }

        // Validation taille
        if (image.size > MAX_IMAGE_SIZE_BYTES) {
          const errorMsg = `Image trop volumineuse: ${image.name} (${image.size} octets)`;
          console.error(`${DEBUG_PREFIX} ${errorMsg}`);
          failedUploads.push({ index: i, error: errorMsg, fileName: image.name });
          continue;
        }

        // Conversion en buffer pour Cloudinary
        const buffer = Buffer.from(await image.arrayBuffer());

        try {
          const uploaded = await uploadToCloudinary(buffer, `parts/${part.id}`, 'image', mimeType);

          const imageCount = await prisma.partImage.count({
            where: { partId: part.id },
          });

          await prisma.partImage.create({
            data: {
              partId: part.id,
              url: uploaded.url,
              publicId: uploaded.publicId,
              altText: image.name,
              caption: tag,
              order: imageCount,
              isPrimary: imageCount === 0,
            },
          });

          console.log(`${DEBUG_PREFIX} Image ${i + 1}/${images.length} uploadée: ${uploaded.url}`);
        } catch (uploadErr) {
          const errorMsg = (uploadErr as Error).message || String(uploadErr);
          console.error(`${DEBUG_PREFIX} Échec upload image ${i + 1}:`, uploadErr);
          failedUploads.push({ index: i, error: errorMsg, fileName: image.name });
        }
      }

      // Si des uploads ont échoué, arrêter et retourner une erreur détaillée
      if (failedUploads.length > 0) {
        const errorMsg = failedUploads
          .map((f) => `Image ${f.index + 1} (${f.fileName}): ${f.error}`)
          .join('. ');
        console.error(
          `${DEBUG_PREFIX} ❌ ${failedUploads.length} image(s) n'ont pas pu être uploadées`,
        );
        return {
          success: false,
          error: `${failedUploads.length} image(s) n'ont pas pu être uploadées. La pièce a été créée mais sans ces images : ${errorMsg}.`,
        };
      }

      console.log(`${DEBUG_PREFIX} ✅ Toutes les images ont été traitées avec succès`);
    }

    console.log(`${DEBUG_PREFIX} === FIN ACTION SERVEUR (SUCCÈS) ===`);
    return { success: true, partId: part.id };
  } catch (error) {
    console.error(`${DEBUG_PREFIX} 💥 EXCEPTION:`, error);
    console.error(`${DEBUG_PREFIX} Error name:`, (error as Error)?.name);
    console.error(`${DEBUG_PREFIX} Error message:`, (error as Error)?.message);

    if (error instanceof z.ZodError) {
      const zodErr = error as unknown as {
        errors: Array<{ path: Array<string | number>; message: string }>;
      };
      console.error(`${DEBUG_PREFIX} Erreur validation Zod:`, zodErr.errors);
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
      error: (error as Error)?.message || 'Erreur inconnue',
    };
  }
}
