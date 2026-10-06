import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getParts } from '@/lib/data/parts';
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

    const partNumber = `PL-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPart = await prisma.part.create({
      data: {
        ...validated,
        partNumber,
        status: validated.status ? (validated.status.toUpperCase() as Part['status']) : 'DRAFT',
      },
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

    return NextResponse.json(newPart, { status: 201 });
  } catch (error) {
    console.error('Error creating part:', error);
    return NextResponse.json({ message: 'Erreur création pièce' }, { status: 400 });
  }
}
