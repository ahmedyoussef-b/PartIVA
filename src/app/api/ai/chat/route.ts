import { NextResponse } from 'next/server';
import { getProvider } from '@/lib/ai/providers';
import { getCurrentUser } from '@/lib/auth-server';
import { acquireLlmGuard, hashKey } from '@/lib/utils/llm-guard';
import { getLlmCacheAsync, setLlmCacheAsync } from '@/lib/utils/llm-cache';
import { rateLimit } from '@/lib/utils/rate-limit';

export async function POST(req: Request) {
  let userId = 'anonymous';
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ reply: 'Non authentifié', source: 'mock' }, { status: 401 });
    }
    userId = user.id;
  } catch {
    return NextResponse.json({ reply: 'Non authentifié', source: 'mock' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const limit = rateLimit(`ai:chat:${userId || ip}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { reply: 'Trop de requêtes, réessayez plus tard', source: 'mock' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  const body = await req.json();
  const message = body?.message ?? '';
  const providerId = body?.providerId;
  const context = body?.context ?? null;

  if (process.env.AI_MOCK === 'true') {
    return NextResponse.json({ reply: `[MOCK] ${message}`, source: 'mock' });
  }

  const provider = getProvider(providerId);
  if (!provider.isAvailable) {
    return NextResponse.json({ reply: `${provider.name} indisponible`, source: 'mock' });
  }

  const cacheKey = `ai:chat:${hashKey(JSON.stringify({ message, context, providerId }))}`;
  const cached = await getLlmCacheAsync<{ reply: string; source: string }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const guard = acquireLlmGuard(`ai:chat:${userId || ip}`);
  if (!guard.ok) {
    return NextResponse.json({ reply: 'Requête déjà en cours', source: 'mock' }, { status: 429 });
  }

  try {
    const reply = await provider.chat([{ role: 'user', content: message }], context);
    await setLlmCacheAsync(cacheKey, { reply, source: provider.id });
    return NextResponse.json({ reply, source: provider.id });
  } catch (e) {
    return NextResponse.json({ reply: e instanceof Error ? e.message : 'Erreur', source: 'mock' });
  } finally {
    guard.release();
  }
}
