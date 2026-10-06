import { NextResponse } from 'next/server';
import { getPartById } from '@/lib/data/parts';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const part = await getPartById(params.id);

  if (!part) {
    return NextResponse.json({ message: 'Pièce non trouvée' }, { status: 404 });
  }

  return NextResponse.json(part);
}
