import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SpecificationSchema = z.object({
  key: z.string().min(1).max(200),
  value: z.string().min(1).max(2000),
  unit: z.string().max(50).nullable().optional(),
  toleranceMin: z.number().nullable().optional(),
  toleranceMax: z.number().nullable().optional(),
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; specId: string }> },
) {
  try {
    const { session, response: authError } = await getSessionOr401();
    if (authError) return authError;

    const { id, specId } = await params;
    const { part, response: partError } = await getPartOrError(id);
    if (partError) return partError;

    const ownershipError = checkOwnership(session!, part!);
    if (ownershipError) return ownershipError;

    const spec = await prisma.partSpecification.findFirst({
      where: { id: specId, partId: id },
      select: { id: true },
    });
    if (!spec) {
      return NextResponse.json({ message: 'Spécification non trouvée' }, { status: 404 });
    }

    const body = await req.json();
    const validated = SpecificationSchema.partial().parse(body);

    const updated = await prisma.partSpecification.update({
      where: { id: specId },
      data: {
        ...(validated.key !== undefined ? { key: validated.key } : {}),
        ...(validated.value !== undefined ? { value: validated.value } : {}),
        ...(validated.unit !== undefined ? { unit: validated.unit ?? null } : {}),
        ...(validated.toleranceMin !== undefined
          ? { toleranceMin: validated.toleranceMin ?? null }
          : {}),
        ...(validated.toleranceMax !== undefined
          ? { toleranceMax: validated.toleranceMax ?? null }
          : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ message: 'Payload invalide' }, { status: 400 });
    }
    console.error('Error updating specification:', error);
    return NextResponse.json({ message: 'Erreur mise à jour spécification' }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; specId: string }> },
) {
  try {
    const { session, response: authError } = await getSessionOr401();
    if (authError) return authError;

    const { id, specId } = await params;
    const { part, response: partError } = await getPartOrError(id);
    if (partError) return partError;

    const ownershipError = checkOwnership(session!, part!);
    if (ownershipError) return ownershipError;

    const spec = await prisma.partSpecification.findFirst({
      where: { id: specId, partId: id },
      select: { id: true },
    });
    if (!spec) {
      return NextResponse.json({ message: 'Spécification non trouvée' }, { status: 404 });
    }

    await prisma.partSpecification.delete({ where: { id: specId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting specification:', error);
    return NextResponse.json({ message: 'Erreur suppression spécification' }, { status: 400 });
  }
}
