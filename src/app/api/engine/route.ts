/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
import { NextRequest, NextResponse } from 'next/server';
import { runEngine } from '@/core/ai-engine/engine';
import { ingestInput } from '@/core/ai-engine/skills/ingest';
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

    if (mode === 'deep' && (result.search.searchStatus === 'partial' || result.search.searchStatus === 'not_found')) {
      const apiKey = getGroqApiKey();
      if (apiKey) {
        const desc = await callGroq(
          [
            { role: 'system', content: 'Generate a technical description of the part.' },
            { role: 'user', content: `Photos: ${JSON.stringify(body.photos || [])}\nDimensions: ${JSON.stringify(body.dimensions || {})}\nDescription: ${body.description || ''}` },
          ],
          apiKey
        );
        const enriched: IngestInput = { ...input, description: desc.content };
        result = await runEngine(enriched, { mode });
      }
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


