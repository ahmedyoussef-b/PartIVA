import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPartCompleteness } from '@/lib/data/part-completeness';

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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response: authError } = await getSessionOr401();
  if (authError) return authError;

  const { id } = await params;

  if (session!.user.role === 'USER') {
    const part = await prisma.part.findUnique({
      where: { id },
      select: { clientId: true },
    });
    if (!part) {
      return NextResponse.json({ message: 'Pièce non trouvée' }, { status: 404 });
    }
    if (part.clientId && part.clientId !== session!.user.id) {
      return NextResponse.json(
        { message: 'Pièce non détenue par cet utilisateur' },
        { status: 403 },
      );
    }
  }

  const completeness = await getPartCompleteness(id);
  if (!completeness) {
    return NextResponse.json({ message: 'Pièce non trouvée' }, { status: 404 });
  }

  return NextResponse.json(completeness);
}
