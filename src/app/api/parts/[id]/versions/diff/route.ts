import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeVersionDiff } from '@/lib/part-version-diff';
import { z } from 'zod';

const DiffQuerySchema = z.object({
  from: z.coerce.number().int().min(1),
  to: z.coerce.number().int().min(1),
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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, response: authError } = await getSessionOr401();
    if (authError) return authError;

    const { id } = await params;
    const { part, response: partError } = await getPartOrError(id);
    if (partError) return partError;

    const ownershipError = checkOwnership(session!, part!);
    if (ownershipError) return ownershipError;

    const { searchParams } = new URL(req.url);
    const validated = DiffQuerySchema.parse({
      from: searchParams.get('from'),
      to: searchParams.get('to'),
    });

    const fromVersion = await prisma.partVersion.findFirst({
      where: { partId: id, versionNumber: validated.from },
      select: { versionNumber: true, snapshot: true },
    });
    if (!fromVersion) {
      return NextResponse.json(
        { message: `Version ${validated.from} introuvable` },
        { status: 404 },
      );
    }

    const toVersion = await prisma.partVersion.findFirst({
      where: { partId: id, versionNumber: validated.to },
      select: { versionNumber: true, snapshot: true },
    });
    if (!toVersion) {
      return NextResponse.json({ message: `Version ${validated.to} introuvable` }, { status: 404 });
    }

    const diffs = computeVersionDiff(fromVersion, toVersion);

    return NextResponse.json({
      from: validated.from,
      to: validated.to,
      diffs,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ message: 'Payload invalide' }, { status: 400 });
    }
    console.error('Error computing version diff:', error);
    return NextResponse.json({ message: 'Erreur diff versions' }, { status: 400 });
  }
}
