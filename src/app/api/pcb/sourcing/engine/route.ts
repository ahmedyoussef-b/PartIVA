import { NextResponse } from 'next/server';
import { sourceBom } from '@/lib/pcb/sourcing-engine';

export async function POST(req: Request) {
  try {
    const { bomItems } = (await req.json()) as {
      bomItems?: Array<{ reference: string; mpn?: string; description?: string; quantity: number }>;
    };

    if (!Array.isArray(bomItems)) {
      return NextResponse.json({ error: 'bomItems must be an array' }, { status: 400 });
    }

    const results = await sourceBom(bomItems);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[SOURCING] Error:', error);
    return NextResponse.json({ error: 'Sourcing failed' }, { status: 500 });
  }
}
