import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_CAD_SIZE = 50 * 1024 * 1024;

const CAD_MIMES = [
  'application/step',
  'model/step',
  'application/iges',
  'model/iges',
  'model/stl',
  'model/obj',
  'model/3mf',
  'application/octet-stream',
];

function detectFileType(name: string): 'CAD_STEP' | 'CAD_IGES' | 'CAD_STL' | 'CAD_OBJ' | null {
  const ext = name.toLowerCase().split('.').pop();
  switch (ext) {
    case 'step':
    case 'stp':
      return 'CAD_STEP';
    case 'iges':
    case 'igs':
      return 'CAD_IGES';
    case 'stl':
      return 'CAD_STL';
    case 'obj':
    case '3mf':
      return 'CAD_OBJ';
    default:
      return null;
  }
}

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type doit être multipart/form-data' },
        { status: 400 },
      );
    }

    let file: File;
    try {
      const formData = await request.formData();
      file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const fileType = detectFileType(file.name);
    if (!fileType && !CAD_MIMES.includes(file.type)) {
      return NextResponse.json({ error: 'Format CAO non supporté' }, { status: 400 });
    }

    if (file.size > MAX_CAD_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 50MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'partiva/cad',
          resource_type: 'raw',
          public_id: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
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
      fileType: fileType ?? 'OTHER',
      name: file.name,
      sizeBytes: file.size,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error)?.message || "Échec de l'upload" },
      { status: 500 },
    );
  }
}
