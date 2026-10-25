import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DEBUG_PREFIX = '[DEBUG-API-UPLOAD]';
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export async function POST(request: NextRequest) {
  console.log(`${DEBUG_PREFIX} === DÉBUT UPLOAD ===`);

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        console.log('[DEBUG-API-UPLOAD] Fichier reçu:', {
          name: file?.name,
          size: file?.size,
          type: file?.type,
        });

        if (!file) {
          console.error(`${DEBUG_PREFIX} Aucun fichier fourni`);
          return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
        }

        console.log(`${DEBUG_PREFIX} Fichier reçu:`, {
          name: file.name,
          size: file.size,
          type: file.type,
        });

        if (!file.type.startsWith('image/')) {
          console.error(`${DEBUG_PREFIX} Type de fichier invalide:`, file.type);
          return NextResponse.json({ error: 'Seules les images sont acceptées' }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
          console.error(`${DEBUG_PREFIX} Fichier trop volumineux:`, file.size);
          return NextResponse.json(
            { error: `Fichier trop volumineux (max 15MB)` },
            { status: 400 },
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log(`${DEBUG_PREFIX} Upload vers Cloudinary...`);

        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: (formData.get('folder')?.toString() as string) || 'partiva/requests',
              resource_type: 'auto',
              transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto' }],
            },
            (error, result) => {
              if (error) {
                console.error(`${DEBUG_PREFIX} Erreur Cloudinary:`, error);
                reject(error);
              } else {
                resolve(result as CloudinaryUploadResult);
              }
            },
          );
          uploadStream.end(buffer);
        });

        console.log(`${DEBUG_PREFIX} ✅ Upload réussi:`, result.secure_url);

        return NextResponse.json({
          success: true,
          url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (e) {
        console.error(`${DEBUG_PREFIX} FormData parse error:`, e);
        return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
      }
    }

    try {
      const body = await request.json();

      if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
      }

      if (!body.data || !body.mimeType) {
        return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
      }

      if (typeof body.mimeType !== 'string' || !body.mimeType.startsWith('image/')) {
        return NextResponse.json({ error: 'Type MIME non autorisé' }, { status: 400 });
      }

      try {
        const buffer = Buffer.from(body.data, 'base64');
        if (buffer.length > MAX_SIZE) {
          return NextResponse.json(
            { error: `Fichier trop volumineux (max 15MB)` },
            { status: 400 },
          );
        }

        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: body.folder || 'partiva/requests',
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result as CloudinaryUploadResult);
              }
            },
          );
          uploadStream.end(buffer);
        });

        return NextResponse.json({
          success: true,
          url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (uploadErr) {
        console.error(`${DEBUG_PREFIX} Cloudinary error:`, uploadErr);
        return NextResponse.json({ error: 'Type MIME non autorisé' }, { status: 400 });
      }
    } catch (jsonErr) {
      console.error(`${DEBUG_PREFIX} JSON parse error:`, jsonErr);
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
  } catch (error) {
    console.error(`${DEBUG_PREFIX} 💥 EXCEPTION:`, error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Échec de l'upload" },
      { status: 500 },
    );
  }
}
