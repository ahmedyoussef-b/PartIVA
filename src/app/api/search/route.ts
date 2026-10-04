import { NextResponse } from 'next/server'
import { MOCK_SEARCH_CANDIDATES } from '@/lib/mock-data'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { source, query } = body

    if (source && source !== 'all') {
      const filtered = MOCK_SEARCH_CANDIDATES.filter((c) => c.source === source)
      return NextResponse.json(filtered)
    }

    // Default fused return sorted by global score descending
    const sorted = [...MOCK_SEARCH_CANDIDATES].sort(
      (a, b) => b.scores.global - a.scores.global
    )
    return NextResponse.json(sorted)
  } catch (err) {
    return NextResponse.json({ message: 'Erreur moteur de recherche' }, { status: 500 })
  }
}
