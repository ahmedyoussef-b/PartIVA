import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import type { AggregationResult } from '@/lib/connectors/aggregator';

export type AggregateSearchResult = AggregationResult & {
  _cache?: 'hit' | 'miss';
};

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export function isCacheEnabled(): boolean {
  return process.env.SEARCH_CACHE_ENABLED !== 'false';
}

export function hashCacheKey(query: string, source: string): string {
  return createHash('sha256')
    .update(`${source}:${query.trim().toLowerCase()}`)
    .digest('hex')
    .slice(0, 32);
}

export async function getCache(cacheKey: string): Promise<AggregateSearchResult | null> {
  if (!isCacheEnabled()) return null;
  try {
    const entry = await prisma.webSearchCache.findUnique({ where: { cacheKey } });
    if (!entry) return null;
    if (entry.expiresAt < new Date()) {
      await prisma.webSearchCache.delete({ where: { cacheKey } }).catch(() => null);
      return null;
    }
    return entry.payload as unknown as AggregateSearchResult;
  } catch (error) {
    console.warn('[search-cache] getCache error:', error);
    return null;
  }
}

export async function setCache(
  cacheKey: string,
  payload: AggregateSearchResult,
  source: string,
  ttlMs = DEFAULT_TTL_MS,
): Promise<void> {
  if (!isCacheEnabled()) return;
  try {
    const expiresAt = new Date(Date.now() + ttlMs);
    const jsonPayload = payload as unknown as Prisma.InputJsonValue;
    await prisma.webSearchCache.upsert({
      where: { cacheKey },
      update: { payload: jsonPayload, expiresAt, source },
      create: { cacheKey, payload: jsonPayload, expiresAt, source },
    });
  } catch (error) {
    console.warn('[search-cache] setCache error:', error);
  }
}

export async function purgeCache(source?: string): Promise<number> {
  try {
    const result = await prisma.webSearchCache.deleteMany({
      where: source ? { source } : {},
    });
    return result.count;
  } catch (error) {
    console.warn('[search-cache] purgeCache error:', error);
    return 0;
  }
}

