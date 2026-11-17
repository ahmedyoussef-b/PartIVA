import { NextResponse } from 'next/server';
import { prepareAutoroute } from '@/lib/pcb/autorouter';

export async function POST(req: Request) {
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
