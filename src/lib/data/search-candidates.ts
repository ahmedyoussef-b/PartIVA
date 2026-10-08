import { prisma } from '@/lib/prisma';
import type { SearchCandidate } from '@/schemas/search';
import { CandidateScoresSchema } from '@/schemas/search';

export async function getSearchCandidates(options?: {
  source?: string;
}): Promise<SearchCandidate[]> {
  const where = options?.source ? { source: options.source } : undefined;

  const rows = await prisma.searchCandidate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return rows.map((row) => ({
    id: row.id,
    source: row.source as SearchCandidate['source'],
    reference: row.reference,
    name: row.name,
    manufacturer: row.manufacturer ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    cadAvailable: row.cadAvailable,
    datasheetAvailable: row.datasheetAvailable,
    scores: CandidateScoresSchema.parse(row.scores),
    metadata: (row.metadata as Record<string, unknown> | undefined) ?? undefined,
  }));
}
