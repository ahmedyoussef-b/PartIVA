import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getPartById } from '@/lib/data/parts';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }

  const { id } = await params;
  const part = await getPartById(id);

  if (!part) {
    return NextResponse.json({ message: 'Pièce non trouvée' }, { status: 404 });
  }

  // Sécurité #5 : vérification propriété si USER
  const actorRole = (session.user as { role?: string }).role;
  if (actorRole === 'USER' && part.clientId !== session.user.id) {
    return NextResponse.json({ message: 'Pièce non détenue par cet utilisateur' }, { status: 403 });
  }

  return NextResponse.json(part);
}
