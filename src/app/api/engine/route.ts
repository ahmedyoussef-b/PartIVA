/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
import { NextRequest, NextResponse } from 'next/server';
import { runEngine } from '@/core/ai-engine/engine';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { callGroq, getGroqApiKey } from '@/lib/ai/groq-client';
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

    let result = await runEngine(input, { mode });

    if (
      mode === 'deep' &&
      (result.search.searchStatus === 'partial' || result.search.searchStatus === 'not_found')
    ) {
      const apiKey = getGroqApiKey();
      if (apiKey) {
        const desc = await callGroq(
          [
            { role: 'system', content: 'Generate a technical description of the part.' },
            {
              role: 'user',
              content: `Photos: ${JSON.stringify(body.photos || [])}\nDimensions: ${JSON.stringify(body.dimensions || {})}\nDescription: ${body.description || ''}`,
            },
          ],
          apiKey,
        );
        const enriched: IngestInput = { ...input, description: desc.content };
        result = await runEngine(enriched, { mode });
      }
    }

    const resultPayload = { success: true, ...result };

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
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
