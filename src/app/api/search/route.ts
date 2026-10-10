import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getSearchCandidates } from '@/lib/data/search-candidates';
import { searchParts } from '@/lib/data/search';
import { PartSearchQuerySchema } from '@/schemas/search';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { source } = body;

    if (source && source !== 'all') {
      const filtered = await getSearchCandidates({ source });
      return NextResponse.json(filtered);
    }

    const sorted = await getSearchCandidates();
    sorted.sort((a, b) => b.scores.global - a.scores.global);
    return NextResponse.json(sorted);
  } catch {
    return NextResponse.json({ error: 'Erreur moteur de recherche' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const validated = PartSearchQuerySchema.parse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit') ?? undefined,
    });

    const isUser = session.user.role === 'USER';
    const results = await searchParts(validated.q, {
      clientId: isUser ? session.user.id : undefined,
      limit: validated.limit,
    });

    return NextResponse.json({
      query: validated.q,
      count: results.length,
      results,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ message: 'Payload invalide' }, { status: 400 });
    }
    console.error('Error searching parts:', error);
    return NextResponse.json({ message: 'Erreur recherche' }, { status: 400 });
  }
}
