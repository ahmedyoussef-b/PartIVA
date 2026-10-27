import { SearchCandidate } from './types';

export function aggregateResults(
  local: SearchCandidate[],
  web: SearchCandidate[],
  maxResults: number
): SearchCandidate[] {
  const all = [...local, ...web];
  const seen = new Set<string>();
  const unique: SearchCandidate[] = [];

  for (const candidate of all) {
    const key = candidate.fileUrl || candidate.id;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(candidate);
  }

  unique.sort((a, b) => b.score - a.score);
  return unique.slice(0, maxResults);
}
