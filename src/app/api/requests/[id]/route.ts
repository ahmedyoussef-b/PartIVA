import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestById } from '@/lib/data/requests';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await getRequestById(id);

  if (!request) {
    return NextResponse.json({ message: 'Demande non trouvée' }, { status: 404 });
  }

  return NextResponse.json(request);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const request = await getRequestById(id);

    if (!request) {
      return NextResponse.json({ message: 'Demande non trouvée' }, { status: 404 });
    }

    const updated = await prisma.request.update({
      where: { id },
      data: {
        status: body.status ? body.status.toUpperCase() : request.status,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        projects: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json({ message: 'Erreur mise à jour' }, { status: 400 });
  }
}