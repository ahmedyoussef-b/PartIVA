import { NextResponse } from 'next/server';
import { prepareAutoroute } from '@/lib/pcb/autorouter';
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
    const { components, nets } = await req.json();

    if (!components || !nets) {
      return NextResponse.json({ error: 'Components and nets are required' }, { status: 400 });
    }

    const result = await prepareAutoroute(components, nets);

    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
