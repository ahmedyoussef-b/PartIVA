import { NextResponse } from 'next/server';
import { INITIAL_REQUESTS } from '@/lib/mock-data';

const requestsMemory = [...INITIAL_REQUESTS];

export async function GET() {
  return NextResponse.json(requestsMemory);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      cloudId: Math.floor(1040 + Math.random() * 50),
      client: body.client || { name: 'Client Usine', email: 'client@usine.tn' },
      machineRef: body.machineRef || '',
      partDescription: body.partDescription || 'Pièce industrielle sans description',
      partFunction: body.partFunction || '',
      suspectedMaterial: body.suspectedMaterial || undefined,
      quantity: Number(body.quantity) || 1,
      urgency: body.urgency || 'normal',
      photos: body.photos || [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'new' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    requestsMemory.unshift(newRequest);
    return NextResponse.json(newRequest, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Payload invalide' }, { status: 400 });
  }
}
