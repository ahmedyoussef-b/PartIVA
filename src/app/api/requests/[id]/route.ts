import { NextResponse } from 'next/server';
import { INITIAL_REQUESTS } from '@/lib/mock-data';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const item = INITIAL_REQUESTS.find((r) => r.id === params.id);
  if (!item) {
    return NextResponse.json({ message: 'Demande non trouvée' }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const item = INITIAL_REQUESTS.find((r) => r.id === params.id);
    if (!item) {
      return NextResponse.json({ message: 'Demande non trouvée' }, { status: 404 });
    }

    if (body.status) item.status = body.status;
    if (body.partId) item.partId = body.partId;
    item.updatedAt = new Date().toISOString();

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ message: 'Erreur mise à jour' }, { status: 400 });
  }
}
