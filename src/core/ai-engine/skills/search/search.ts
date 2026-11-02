/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
import { SearchInput, SearchResult, EngineWarning } from './types';
import { searchLocal } from './local-search';
import { searchWeb } from './web-search';
import { aggregateResults } from './aggregate';
import { getErrorMessage } from '@/lib/ai/engine-error-messages';

export async function searchParts(input: SearchInput): Promise<SearchResult> {
  const threshold = input.threshold ?? 0.7;
  const maxResults = input.maxResults ?? 10;
  const warnings: string[] = [];
  const structuredWarnings: EngineWarning[] = [];

  try {
    if (input.mode === 'quick') {
      const local = await searchLocal({ ...input, threshold, maxResults });
      if (local.length === 0) {
        warnings.push('SEARCH_LOCAL_EMPTY');
        structuredWarnings.push({ code: 'SEARCH_LOCAL_EMPTY', message: getErrorMessage('SEARCH_LOCAL_EMPTY'), stage: 'search' });
        console.warn('[searchParts] local empty -> web fallback');
        warnings.push('SEARCH_WEB_FALLBACK_USED');
        structuredWarnings.push({ code: 'SEARCH_WEB_FALLBACK_USED', message: getErrorMessage('SEARCH_WEB_FALLBACK_USED'), stage: 'search' });
        const web = await searchWeb({ ...input, threshold, maxResults });
        const aggregated = aggregateResults(local, web, maxResults);
        if (aggregated.length === 0) {
          warnings.push('SEARCH_WEB_FAILED');
          structuredWarnings.push({ code: 'SEARCH_WEB_FAILED', message: getErrorMessage('SEARCH_WEB_FAILED'), stage: 'search' });
          return {
            candidates: [],
            searchStatus: 'not_found',
            mode: 'quick',
            warnings,
            structuredWarnings,
          };
        }
        // web results only if web returned
        if (web.length === 0) {
          // web failed silently
        }
        const found = aggregated.filter((c) => c.score >= threshold);
        return {
          candidates: aggregated.slice(0, maxResults),
          searchStatus: found.length >= 1 ? 'found' : 'partial',
          mode: 'quick',
          warnings,
          structuredWarnings: web.length > 0 ? structuredWarnings : structuredWarnings,
        };
      }
      const found = local.filter((c) => c.score >= threshold);
      return {
        candidates: local.slice(0, maxResults),
        searchStatus: found.length >= 1 ? 'found' : 'partial',
        mode: 'quick',
        warnings,
        structuredWarnings,
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
        structuredWarnings,
      };
    }

    warnings.push('completing_with_web_search');
    warnings.push('SEARCH_WEB_FALLBACK_USED');
    structuredWarnings.push({ code: 'SEARCH_WEB_FALLBACK_USED', message: getErrorMessage('SEARCH_WEB_FALLBACK_USED'), stage: 'search' });
    const web = await searchWeb({ ...input, threshold, maxResults });
    const aggregated = aggregateResults(local, web, maxResults);

    if (aggregated.length === 0) {
      return {
        candidates: [],
        searchStatus: 'not_found',
        mode: 'deep',
        warnings,
        structuredWarnings,
      };
    }

    const found = aggregated.filter((c) => c.score >= threshold);
    return {
      candidates: aggregated,
      searchStatus: found.length >= 1 ? 'found' : 'partial',
      mode: 'deep',
      warnings,
      structuredWarnings,
    };
  } catch (error) {
    return {
      candidates: [],
      searchStatus: 'not_found',
      mode: input.mode,
      warnings: ['search_failed'],
      structuredWarnings: [{ code: 'SEARCH_FAILED', message: getErrorMessage('SEARCH_FAILED'), stage: 'search' }],
    };
  }
}
