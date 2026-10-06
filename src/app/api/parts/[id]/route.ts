import { NextResponse } from 'next/server';
import { getPartById } from '@/lib/data/parts';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const part = await getPartById(id);

  if (!part) {
    return NextResponse.json({ message: 'Pièce non trouvée' }, { status: 404 });
  }

  return NextResponse.json(part);
}
