import { NextResponse } from 'next/server';
import { callGroq, getGroqApiKey } from '@/lib/ai/groq-client';

export async function POST(req: Request) {
  const body = await req.json();
  const message = body?.message ?? '';
  const context = body?.context ?? null;
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return NextResponse.json({ reply: 'GROQ_API_KEY manquant', source: 'mock' });
  }
  const system = `Tu es un assistant technique. Contexte: ${JSON.stringify(context)}`;
  const { content } = await callGroq(
    [
      { role: 'system', content: system },
      { role: 'user', content: message },
    ],
    apiKey,
  );
  return NextResponse.json({ reply: content, source: 'groq' });
}
