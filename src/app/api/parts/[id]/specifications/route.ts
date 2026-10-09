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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response: authError } = await getSessionOr401();
  if (authError) return authError;

  const { id } = await params;
  const part = await prisma.part.findUnique({
    where: { id },
    select: { id: true, clientId: true },
  });
  if (!part) {
    return NextResponse.json({ message: 'Pièce non trouvée' }, { status: 404 });
  }

  const ownershipError = checkOwnership(session!, part);
  if (ownershipError) return ownershipError;

  const specifications = await prisma.partSpecification.findMany({
    where: { partId: id },
    orderBy: { key: 'asc' },
  });
  return NextResponse.json(specifications);
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
    const validated = SpecificationSchema.parse(body);

    const existing = await prisma.partSpecification.findUnique({
      where: { partId_key: { partId: id, key: validated.key } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { message: `Spécification « ${validated.key} » déjà existante` },
        { status: 409 },
      );
    }

    const created = await prisma.partSpecification.create({
      data: {
        partId: id,
        key: validated.key,
        value: validated.value,
        unit: validated.unit ?? null,
        toleranceMin: validated.toleranceMin ?? null,
        toleranceMax: validated.toleranceMax ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ message: 'Payload invalide' }, { status: 400 });
    }
    console.error('Error creating specification:', error);
    return NextResponse.json({ message: 'Erreur création spécification' }, { status: 400 });
  }
}
