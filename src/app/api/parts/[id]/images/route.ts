import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  PartImageUploadSchema,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from '@/schemas/part';
import { uploadToCloudinary, UploadError } from '@/lib/upload';

function isImageMimeType(value: string): value is (typeof ALLOWED_IMAGE_MIME_TYPES)[number] {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(value);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const images = await prisma.partImage.findMany({
    where: { partId: id },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(images);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const part = await prisma.part.findUnique({ where: { id: (await params).id } });
    if (!part) {
      return NextResponse.json({ message: 'Pièce introuvable' }, { status: 404 });
    }

    const body = await req.json();
    const validated = PartImageUploadSchema.parse(body);

    if (!isImageMimeType(validated.mimeType)) {
      return NextResponse.json(
        { message: `Type MIME non autorisé. Autorisés : ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    if (validated.sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { message: `Image trop volumineuse (max ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024} Mo)` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(validated.data, 'base64');

    const uploaded = await uploadToCloudinary(
      buffer,
      `parts/${part.id}`,
      'image',
      validated.mimeType,
    );

    const imageCount = await prisma.partImage.count({ where: { partId: part.id } });

    const newImage = await prisma.partImage.create({
      data: {
        partId: part.id,
        url: uploaded.url,
        publicId: uploaded.publicId,
        altText: validated.altText ?? validated.filename,
        caption: validated.caption,
        order: imageCount,
        isPrimary: imageCount === 0,
      },
    });

    return NextResponse.json(newImage, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      const statusMap: Record<UploadError['code'], number> = {
        INVALID_MIME: 400,
        TOO_LARGE: 400,
        UPLOAD_FAILED: 502,
      };
      return NextResponse.json({ message: error.message }, { status: statusMap[error.code] });
    }

    console.error('Error uploading part image:', error);
    return NextResponse.json({ message: 'Erreur upload image' }, { status: 400 });
  }
}
