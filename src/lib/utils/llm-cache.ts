// Cache LLM à deux niveaux :
// - L1 mémoire (rapide, par instance)
// - L2 base de données (partagé entre instances serverless)
// Les fonctions synchrones restent disponibles pour les appelants historiques ;
// les routes LLM coûteuses utilisent les variantes async persistantes.

import type { Prisma } from '@/generated/prisma/client';

interface Entry {
  expires: number;
  value: unknown;
}

const store = new Map<string, Entry>();
const DEFAULT_TTL_MS = 60 * 60 * 1000;
const DB_TIMEOUT_MS = 800;

// La base peut être lente/indisponible : le cache L2 ne doit jamais bloquer l'appel LLM.
function withDbTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), DB_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

function pruneMemory(now: number): void {
  if (store.size < 500) return;
  for (const [key, entry] of store) {
    if (entry.expires < now) store.delete(key);
  }
}

export function getLlmCache<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expires < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setLlmCache<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  pruneMemory(Date.now());
  store.set(key, { expires: Date.now() + ttlMs, value });
}

export function clearLlmCache(): void {
  store.clear();
}

// L2 persistant : best-effort, ne doit jamais faire échouer l'appel LLM.
export async function getLlmCacheAsync<T>(key: string): Promise<T | undefined> {
  const memory = getLlmCache<T>(key);
  if (memory !== undefined) return memory;

  try {
    const { prisma } = await import('@/lib/prisma');
    const row = await withDbTimeout(prisma.llmCacheEntry.findUnique({ where: { key } }), null);
    if (!row) return undefined;

    if (row.expiresAt.getTime() <= Date.now()) {
      await withDbTimeout(
        prisma.llmCacheEntry.delete({ where: { key } }).catch(() => undefined),
        undefined,
      );
      return undefined;
    }

    const ttl = row.expiresAt.getTime() - Date.now();
    setLlmCache(key, row.value as T, ttl);
    return row.value as T;
  } catch {
    return undefined;
  }
}

export async function setLlmCacheAsync<T>(
  key: string,
  value: T,
  ttlMs = DEFAULT_TTL_MS,
): Promise<void> {
  setLlmCache(key, value, ttlMs);
  try {
    const { prisma } = await import('@/lib/prisma');
    const expiresAt = new Date(Date.now() + ttlMs);
    await withDbTimeout(
      prisma.llmCacheEntry.upsert({
        where: { key },
        create: { key, value: value as unknown as Prisma.InputJsonValue, expiresAt },
        update: { value: value as unknown as Prisma.InputJsonValue, expiresAt },
      }),
      undefined,
    );
    // Nettoyage opportuniste des entrées expirées (index expiresAt).
    await withDbTimeout(
      prisma.llmCacheEntry.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      { count: 0 },
    );
  } catch {
    // best-effort : le cache L1 reste valide pour l'instance courante
  }
}

export async function clearLlmCacheAsync(): Promise<void> {
  store.clear();
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.llmCacheEntry.deleteMany({});
  } catch {
    // ignore
  }
}
