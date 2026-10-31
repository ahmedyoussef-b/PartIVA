import type { SearchCandidate, SearchResult } from '@/core/ai-engine/skills/search/types';
import type { SearchResultItem } from '@/components/search-bar';

export function mapEngineCandidateToSearchResult(
  candidate: SearchCandidate,
  rank: number,
): SearchResultItem {
  const metadata = candidate.metadata ?? {};
  return {
    id: candidate.id,
    ptvReference: (metadata.ptvReference as string) || candidate.name || candidate.id,
    partNumber: (metadata.partNumber as string) || '',
    name: candidate.name,
    description: (metadata.description as string) || '',
    status: (metadata.status as string) || 'DRAFT',
    rank,
    matchType: 'engine',
    score: candidate.score,
    matchedSpecs: Array.isArray(metadata.matchedSpecs) ? (metadata.matchedSpecs as SearchResultItem['matchedSpecs']) : [],
    specKey: undefined,
    specValue: undefined,
    toleranceMin: undefined,
    toleranceMax: undefined,
    breakdown: (metadata.breakdown as Record<string, number>) || undefined,
  };
}

export function mapEngineResultToSearchResults(result: SearchResult): SearchResultItem[] {
  return (result.candidates ?? []).map((candidate, index) =>
    mapEngineCandidateToSearchResult(candidate, index + 1),
  );
}
