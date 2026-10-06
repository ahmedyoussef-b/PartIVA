import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequests } from '@/lib/data/requests';

export async function GET() {
  const requests = await getRequests();
  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newRequest = await prisma.request.create({
      data: {
        clientId: body.clientId,
        machineRef: body.machineRef || '',
        partDescription: body.partDescription || 'Pièce industrielle sans description',
        partFunction: body.partFunction || '',
        suspectedMaterial: body.suspectedMaterial,
        quantity: Number(body.quantity) || 1,
        urgency: body.urgency || 'MEDIUM',
        photos: body.photos || [],
        status: 'PENDING',
      },
      include: {
        client: true,
        projects: true,
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json({ message: 'Payload invalide' }, { status: 400 });
  }
}