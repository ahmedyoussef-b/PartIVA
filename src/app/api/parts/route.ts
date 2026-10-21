import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { getParts, createPartWithPtvReference } from '@/lib/data/parts';
import { NewPartSchema, type NewPart } from '@/schemas/part';
import { Prisma } from '@/generated/prisma/client';
import { z } from 'zod';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }

  const isUser = session.user.role === 'USER';
  const parts = await getParts(isUser ? { clientId: session.user.id } : undefined);
  return NextResponse.json(parts);
}

function isUniqueConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2002';
  }
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

export async function POST(req: Request) {
  // Sécurité : la création de pièces est réservée à l'atelier (ADMIN).
  // `requireAdmin` lève 'Unauthorized' / 'Forbidden' (cf. src/lib/auth-admin.ts).
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ message }, { status });
  }

  try {
    const body = await req.json();
    const validated = NewPartSchema.parse(body) as NewPart;

    // `partNumber` est @unique : on teste l'existence avant l'insert pour
    // renvoyer une 409 explicite (sinon createPartWithPtvReference réessaie
    // 4 fois la génération du ptvReference avant de propager le P2002).
    const existing = await prisma.part.findUnique({
      where: { partNumber: validated.partNumber },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ message: 'Ce numéro de pièce existe déjà.' }, { status: 409 });
    }

    // `categoryId` n'existe pas dans `Prisma.PartCreateInput` : la relation
    // s'exprime via `category: { connect: { id } }`. Sans ce mapping, Prisma
    // lève « Unknown arg `categoryId` » et la création échoue.
    const { categoryId, ...rest } = validated;

    const newPart = await createPartWithPtvReference({
      ...rest,
      // Le formulaire de création n'expose pas le statut : DRAFT par défaut.
      // L'enum legacy 'draft' | 'validated' | 'deprecated' de NewPartSchema
      // n'existe pas dans l'enum Prisma PartStatus (cf. D-E12-STATUS-ENUM).
      status: 'DRAFT',
      category: categoryId ? { connect: { id: categoryId } } : undefined,
    });

    const partWithRelations = await prisma.part.findUnique({
      where: { id: newPart.id },
      include: {
        category: true,
        images: true,
        specifications: true,
        suppliers: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(partWithRelations, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating part:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Données invalides', issues: error.issues },
        { status: 400 },
      );
    }

    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ message: 'Ce numéro de pièce existe déjà.' }, { status: 409 });
    }

    return NextResponse.json({ message: 'Erreur lors de la création' }, { status: 400 });
  }
}
