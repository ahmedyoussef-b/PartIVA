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
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    const { session, response: authError } = await getSessionOr401();
    if (authError) return authError;

    const { id, imageId } = await params;
    const { part, response: partError } = await getPartOrError(id);
    if (partError) return partError;

    const ownershipError = checkOwnership(session!, part!);
    if (ownershipError) return ownershipError;

    const image = await prisma.partImage.findFirst({
      where: { id: imageId, partId: id },
      select: { id: true, publicId: true, isPrimary: true },
    });
    if (!image) {
      return NextResponse.json({ message: 'Image non trouvée' }, { status: 404 });
    }

    await prisma.partImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const next = await prisma.partImage.findFirst({
        where: { partId: id },
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

    // Cleanup Cloudinary (D-cloudinary-cleanup) — non bloquant si échec
    if (image.publicId) {
      try {
        await new Promise<void>((resolve) => {
          cloudinary.uploader.destroy(
            image.publicId!,
            {
              resource_type: 'image',
            },
            () => resolve(),
          );
        });
      } catch (cleanupError) {
        console.error('Cloudinary cleanup failed for image', imageId, cleanupError);
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting part image:', error);
    return NextResponse.json({ message: 'Erreur suppression image' }, { status: 400 });
  }
}
