import { NextResponse } from 'next/server';
import { sourceBom } from '@/lib/pcb/sourcing-engine';
import { requireAdmin } from '@/lib/auth-admin';

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ message }, { status });
  }
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
