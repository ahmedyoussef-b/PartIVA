import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { uploadToCloudinary, UploadError } from '@/lib/upload';
import { z } from 'zod';

const UploadRequestSchema = z.object({
  folder: z.string().min(1).max(200),
  data: z.string().min(1),
  mimeType: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const validated = UploadRequestSchema.parse(body);

    const buffer = Buffer.from(validated.data, 'base64');

    const resourceType = validated.mimeType.startsWith('image/') ? 'image' : 'raw';

    const result = await uploadToCloudinary(
      buffer,
      validated.folder,
      resourceType,
      validated.mimeType,
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      const statusMap: Record<UploadError['code'], number> = {
        INVALID_MIME: 400,
        TOO_LARGE: 400,
        UPLOAD_FAILED: 502,
      };
      return NextResponse.json({ message: error.message }, { status: statusMap[error.code] });
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ message: 'Payload invalide' }, { status: 400 });
    }

    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json({ message: 'Erreur upload' }, { status: 400 });
  }
}
