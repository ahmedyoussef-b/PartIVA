import { NextResponse } from 'next/server';
import { INITIAL_PARTS } from '@/lib/mock-data';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const item = INITIAL_PARTS.find((p) => p.id === params.id);
  if (!item) {
    return NextResponse.json({ message: 'Pièce non trouvée' }, { status: 404 });
  }
  return NextResponse.json(item);
}
