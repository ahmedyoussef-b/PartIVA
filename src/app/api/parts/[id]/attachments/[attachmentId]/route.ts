import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cloudinary } from '@/lib/cloudinary';

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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  try {
    const { session, response: authError } = await getSessionOr401();
    if (authError) return authError;

    const { id, attachmentId } = await params;
    const { part, response: partError } = await getPartOrError(id);
    if (partError) return partError;

    const ownershipError = checkOwnership(session!, part!);
    if (ownershipError) return ownershipError;

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, partId: id },
      select: { id: true, publicId: true },
    });
    if (!attachment) {
      return NextResponse.json({ message: 'Document non trouvé' }, { status: 404 });
    }

    await prisma.attachment.delete({ where: { id: attachmentId } });

    // Cleanup Cloudinary (D-cloudinary-cleanup) — non bloquant si échec
    if (attachment.publicId) {
      try {
        await new Promise<void>((resolve) => {
          cloudinary.uploader.destroy(
            attachment.publicId!,
            {
              resource_type: 'raw',
            },
            () => resolve(),
          );
        });
      } catch (cleanupError) {
        console.error('Cloudinary cleanup failed for attachment', attachmentId, cleanupError);
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ message: 'Erreur suppression document' }, { status: 400 });
  }
}
