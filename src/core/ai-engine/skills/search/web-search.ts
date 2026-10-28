/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
import { SearchCandidate, SearchInput } from './types';

export async function searchWeb(input: SearchInput): Promise<SearchCandidate[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('/api/search?source=all&limit=10', {
      method: 'GET',
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (!response || !response.ok) {
      return [];
    }

    const data = await response.json();
    const results = data.results || data.data || [];

    const candidates: SearchCandidate[] = results.map((item: any, idx: number) => ({
      id: item.id || `web-${idx}`,
      source: 'web' as const,
      name: item.name || item.title || 'Unknown',
      score: typeof item.score === 'number' ? item.score : 0.6,
      fileUrl: item.fileUrl || item.url,
      thumbnailUrl: item.thumbnailUrl || item.imageUrl,
      metadata: item.metadata || {},
    }));

    return candidates;
  } catch (error) {
    return [];
  }
}
