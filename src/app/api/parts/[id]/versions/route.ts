import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PartVersionsQuerySchema } from '@/schemas/part';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    const part = await prisma.part.findUnique({
      where: { id },
      select: { id: true, clientId: true },
    });

    if (!part) {
      return NextResponse.json({ message: 'Pièce non trouvée' }, { status: 404 });
    }

    // Sécurité #5 : vérification propriété si USER
    const actorRole = (session.user as { role?: string }).role;
    if (actorRole === 'USER' && part.clientId !== session.user.id) {
      return NextResponse.json(
        { message: 'Pièce non détenue par cet utilisateur' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const validated = PartVersionsQuerySchema.parse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    });

    const where = { partId: id };
    const [total, versions] = await Promise.all([
      prisma.partVersion.count({ where }),
      prisma.partVersion.findMany({
        where,
        orderBy: { versionNumber: 'desc' },
        skip: (validated.page - 1) * validated.pageSize,
        take: validated.pageSize,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      page: validated.page,
      pageSize: validated.pageSize,
      versions,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ message: 'Paramètres invalides' }, { status: 400 });
    }

    console.error('Error fetching part versions:', error);
    return NextResponse.json({ message: 'Erreur récupération versions' }, { status: 400 });
  }
}
