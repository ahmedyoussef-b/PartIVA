/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
import { SearchInput, SearchResult } from './types';
import { searchLocal } from './local-search';
import { searchWeb } from './web-search';
import { aggregateResults } from './aggregate';

export async function searchParts(input: SearchInput): Promise<SearchResult> {
  const threshold = input.threshold ?? 0.7;
  const maxResults = input.maxResults ?? 10;
  const warnings: string[] = [];

  try {
    if (input.mode === 'quick') {
      const local = await searchLocal({ ...input, threshold, maxResults });
      if (local.length === 0) {
        warnings.push('no_local_results');
        return {
          candidates: [],
          searchStatus: 'not_found',
          mode: 'quick',
          warnings,
        };
      }
      const found = local.filter((c) => c.score >= threshold);
      return {
        candidates: local.slice(0, maxResults),
        searchStatus: found.length >= 1 ? 'found' : 'partial',
        mode: 'quick',
        warnings,
      };
    }

    // deep mode
    const local = await searchLocal({ ...input, threshold, maxResults });
    const exploitable = local.filter((c) => c.score >= threshold);

    if (exploitable.length >= 3) {
      return {
        candidates: local.slice(0, maxResults),
        searchStatus: 'found',
        mode: 'deep',
        warnings,
      };
    }

    warnings.push('completing_with_web_search');
    const web = await searchWeb({ ...input, threshold, maxResults });
    const aggregated = aggregateResults(local, web, maxResults);

    if (aggregated.length === 0) {
      return {
        candidates: [],
        searchStatus: 'not_found',
        mode: 'deep',
        warnings,
      };
    }

    const found = aggregated.filter((c) => c.score >= threshold);
    return {
      candidates: aggregated,
      searchStatus: found.length >= 1 ? 'found' : 'partial',
      mode: 'deep',
      warnings,
    };
  } catch (error) {
    return {
      candidates: [],
      searchStatus: 'not_found',
      mode: input.mode,
      warnings: ['search_failed'],
    };
  }
}
