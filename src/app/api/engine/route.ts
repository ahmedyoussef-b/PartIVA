import { NextRequest, NextResponse } from 'next/server';
import { runEngine } from '@/core/ai-engine/engine';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { callGroq, hasLlmProvider } from '@/lib/ai/groq-client';
import { acquireLlmGuard, hashKey } from '@/lib/utils/llm-guard';
import { getLlmCacheAsync, setLlmCacheAsync } from '@/lib/utils/llm-cache';
import type { IngestInput } from '@/core/ai-engine/skills/ingest/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input: IngestInput = {
      photos: body.photos,
      cadFiles: body.cadFiles,
      dimensions: body.dimensions,
      description: body.description,
    };

    const mode = body.mode === 'quick' ? 'quick' : 'deep';

    // Idempotence : même requête → résultat mis en cache 5 min (évite un re-run complet).
    const resultCacheKey = `engine:result:${hashKey(JSON.stringify({ input, mode }))}`;
    const cachedResult = await getLlmCacheAsync<{ success: boolean } & Record<string, unknown>>(
      resultCacheKey,
    );
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    const guard = acquireLlmGuard(`engine:${resultCacheKey}`);
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: 'Analyse déjà en cours' }, { status: 429 });
    }

    try {
      let result = await runEngine(input, { mode });

      if (
        mode === 'deep' &&
        (result.search.searchStatus === 'partial' || result.search.searchStatus === 'not_found') &&
        hasLlmProvider()
      ) {
        const descCacheKey = `engine:desc:${hashKey(
          JSON.stringify({
            photos: body.photos ?? [],
            dimensions: body.dimensions ?? {},
            description: body.description ?? '',
          }),
        )}`;
        let desc = await getLlmCacheAsync<string>(descCacheKey);
        if (desc === undefined) {
          const res = await callGroq(
            [
              { role: 'system', content: 'Generate a technical description of the part.' },
              {
                role: 'user',
                content: `Photos: ${JSON.stringify(body.photos || [])}\nDimensions: ${JSON.stringify(body.dimensions || {})}\nDescription: ${body.description || ''}`,
              },
            ],
            undefined,
          );
          desc = res.content;
          await setLlmCacheAsync(descCacheKey, desc);
        }
        if (desc !== undefined) {
          const enriched: IngestInput = { ...input, description: desc };
          result = await runEngine(enriched, { mode });
        }
      }

      const resultPayload = { success: true, ...result };
      await setLlmCacheAsync(resultCacheKey, resultPayload, 5 * 60 * 1000);

      // Enregistrement historique (best-effort)
      try {
        const user = await getCurrentUser();
        if (user) {
          await prisma.searchHistory.create({
            data: {
              userId: user.id,
              query: body.description || '',
              filters: body.dimensions ?? null,
              resultsCount: result.search?.candidates?.length ?? 0,
            },
          });
        }
      } catch {
        // ignore
      }

      return NextResponse.json(resultPayload);
    } finally {
      guard.release();
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
