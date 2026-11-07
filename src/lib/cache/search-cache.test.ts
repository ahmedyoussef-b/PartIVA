import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hashCacheKey,
  getCache,
  setCache,
  purgeCache,
  type AggregateSearchResult,
} from './search-cache';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    webSearchCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('search-cache helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SEARCH_CACHE_ENABLED;
  });

  describe('hashCacheKey', () => {
    it('produces identical hash for identical query and source regardless of casing and trim', () => {
      const h1 = hashCacheKey('  W753 ', 'all', 10);
      const h2 = hashCacheKey('w753', 'all', 10);
      expect(h1).toBe(h2);
      expect(h1).toHaveLength(32);
    });

    it('produces different hash for different queries or sources', () => {
      const h1 = hashCacheKey('w753', 'all', 10);
      const h2 = hashCacheKey('w754', 'all', 10);
      const h3 = hashCacheKey('w753', 'fapi', 10);
      expect(h1).not.toBe(h2);
      expect(h1).not.toBe(h3);
    });
  });

  describe('getCache', () => {
    it('returns null when cache is empty / not found', async () => {
      vi.mocked(prisma.webSearchCache.findUnique).mockResolvedValueOnce(null);
      const res = await getCache('unknown-key');
      expect(res).toBeNull();
    });

    it('returns null and deletes entry when cache is expired', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      vi.mocked(prisma.webSearchCache.findUnique).mockResolvedValueOnce({
        id: '1',
        cacheKey: 'expired-key',
        payload: { candidates: [] } as unknown as Prisma.JsonValue,
        source: 'all',
        expiresAt: expiredDate,
        createdAt: new Date(),
      });
      vi.mocked(prisma.webSearchCache.delete).mockResolvedValueOnce({
        id: '1',
        cacheKey: 'expired-key',
        payload: null,
        source: 'all',
        expiresAt: expiredDate,
        createdAt: new Date(),
      });

      const res = await getCache('expired-key');
      expect(res).toBeNull();
      expect(prisma.webSearchCache.delete).toHaveBeenCalledWith({
        where: { cacheKey: 'expired-key' },
      });
    });

    it('returns payload when cache is valid', async () => {
      const validDate = new Date(Date.now() + 60_000);
      const payload: AggregateSearchResult = {
        candidates: [
          {
            id: '1',
            source: 'local_db',
            reference: 'ref-1',
            name: 'Piece 1',
            scores: { global: 1 },
          },
        ],
        sourcesQueried: ['local_db'],
        sourcesFailed: [],
        sourceDurationsMs: { local_db: 15 },
        totalDurationMs: 20,
      };

      vi.mocked(prisma.webSearchCache.findUnique).mockResolvedValueOnce({
        id: '2',
        cacheKey: 'valid-key',
        payload: payload as unknown as Prisma.JsonValue,
        source: 'all',
        expiresAt: validDate,
        createdAt: new Date(),
      });

      const res = await getCache('valid-key');
      expect(res).toEqual(payload);
    });

    it('returns null if SEARCH_CACHE_ENABLED is false', async () => {
      process.env.SEARCH_CACHE_ENABLED = 'false';
      const res = await getCache('any-key');
      expect(res).toBeNull();
      expect(prisma.webSearchCache.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('setCache', () => {
    it('upserts entry with payload, expiration and source', async () => {
      const payload: AggregateSearchResult = {
        candidates: [],
        sourcesQueried: ['all'],
        sourcesFailed: [],
        sourceDurationsMs: {},
        totalDurationMs: 10,
      };
      vi.mocked(prisma.webSearchCache.upsert).mockResolvedValueOnce({
        id: '1',
        cacheKey: 'my-key',
        payload: payload as unknown as Prisma.JsonValue,
        source: 'all',
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      await setCache('my-key', payload, 'all', 10, 3600_000);
      expect(prisma.webSearchCache.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cacheKey: 'my-key' },
          update: expect.objectContaining({
            source: 'all',
            payload,
          }),
          create: expect.objectContaining({
            cacheKey: 'my-key',
            source: 'all',
            payload,
          }),
        }),
      );
    });
  });

  describe('purgeCache', () => {
    it('deletes entries filtered by source or all', async () => {
      vi.mocked(prisma.webSearchCache.deleteMany).mockResolvedValueOnce({ count: 5 });
      const count = await purgeCache('all');
      expect(count).toBe(5);
      expect(prisma.webSearchCache.deleteMany).toHaveBeenCalledWith({
        where: { source: 'all' },
      });
    });
  });
});
