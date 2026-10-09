import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getParts, createPartWithPtvReference } from '@/lib/data/parts';
import { NewPartSchema, type NewPart } from '@/schemas/part';
import type { Part } from '@/generated/prisma/client';

export async function GET() {
  const parts = await getParts();
  return NextResponse.json(parts);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = NewPartSchema.parse(body) as NewPart;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const newPart = await createPartWithPtvReference({
      ...validated,
      status: validated.status ? (validated.status.toUpperCase() as Part['status']) : 'DRAFT',
      client: session?.user?.id ? { connect: { id: session.user.id } } : undefined,
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
  } catch (error) {
    console.error('Error creating part:', error);
    return NextResponse.json({ message: 'Erreur création pièce' }, { status: 400 });
  }
}
