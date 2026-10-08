import { NextResponse } from 'next/server';
import { getSearchCandidates } from '@/lib/data/search-candidates';

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
