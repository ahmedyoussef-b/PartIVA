import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getFacets } from '@/lib/data/facets';

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isUser = session.user.role === 'USER';
    const clientId = isUser ? session.user.id : undefined;

    // §5.2 : 10 valeurs par catégorie, max 50 (garde NaN → défaut).
    const limitParam = Number(searchParams.get('limit'));
    const limit =
      Number.isFinite(limitParam) && limitParam >= 1 ? Math.min(Math.trunc(limitParam), 50) : 10;

    const result = await getFacets({
      q: searchParams.get('q') ?? undefined,
      material: searchParams.get('material') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      clientId,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error computing facets:', error);
    return NextResponse.json({ message: 'Erreur facettes' }, { status: 500 });
  }
}
