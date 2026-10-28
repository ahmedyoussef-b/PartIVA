import { NextResponse } from 'next/server';
import { getProvider } from '@/lib/ai/providers';

export async function POST(req: Request) {
  const body = await req.json();
  const message = body?.message ?? '';
  const providerId = body?.providerId;
  const context = body?.context ?? null;
  const provider = getProvider(providerId);
  if (!provider.isAvailable) {
    return NextResponse.json({ reply: `${provider.name} indisponible`, source: 'mock' });
  }
  try {
    const reply = await provider.chat([{ role: 'user', content: message }], context);
    return NextResponse.json({ reply, source: provider.id });
  } catch (e) {
    return NextResponse.json({ reply: e instanceof Error ? e.message : 'Erreur', source: 'mock' });
  }
}
