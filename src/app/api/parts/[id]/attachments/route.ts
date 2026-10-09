import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary, UploadError } from '@/lib/upload';
import { z } from 'zod';

const AttachmentUploadSchema = z.object({
  name: z.string().min(1).max(255),
  fileType: z.enum(['PDF', 'CAD_STEP', 'CAD_STL', 'CAD_OBJ', 'OTHER']),
  kind: z.enum(['DOCUMENT', 'CAD', 'SCAN', 'OTHER']).default('DOCUMENT'),
  mimeType: z.string().min(1),
  data: z.string().min(1),
});

async function getSessionOr401() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ message: 'Non authentifié' }, { status: 401 }),
    };
  }
  return { session, response: null };
}

async function getPartOrError(id: string) {
  const part = await prisma.part.findUnique({
    where: { id },
    select: { id: true, clientId: true },
  });
  if (!part) {
    return {
      part: null,
      response: NextResponse.json({ message: 'Pièce non trouvée' }, { status: 404 }),
    };
  }
  return { part, response: null };
}

function checkOwnership(
  session: { user: { id: string; role?: string | null } },
  part: { clientId: string | null },
) {
  if (session.user.role === 'USER' && part.clientId !== session.user.id) {
    return NextResponse.json({ message: 'Pièce non détenue par cet utilisateur' }, { status: 403 });
  }
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attachments = await prisma.attachment.findMany({
    where: { partId: id },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(attachments);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, response: authError } = await getSessionOr401();
    if (authError) return authError;

    const { id } = await params;
    const { part, response: partError } = await getPartOrError(id);
    if (partError) return partError;

    const ownershipError = checkOwnership(session!, part!);
    if (ownershipError) return ownershipError;

    const body = await req.json();
    const validated = AttachmentUploadSchema.parse(body);

    const buffer = Buffer.from(validated.data, 'base64');

    const uploaded = await uploadToCloudinary(
      buffer,
      `parts/${id}/attachments`,
      'raw',
      validated.mimeType,
    );

    const created = await prisma.attachment.create({
      data: {
        partId: id,
        name: validated.name,
        url: uploaded.url,
        publicId: uploaded.publicId,
        fileType: validated.fileType,
        mimeType: validated.mimeType,
        kind: validated.kind,
        sizeBytes: uploaded.size,
      },
    });

    return NextResponse.json(created, { status: 201 });
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
    console.error('Error uploading attachment:', error);
    return NextResponse.json({ message: 'Erreur upload document' }, { status: 400 });
  }
}
