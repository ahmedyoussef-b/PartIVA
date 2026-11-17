import { NextResponse } from 'next/server';
import { analyzeRealState } from '@/lib/pcb/simulation';

export async function POST(req: Request) {
  try {
    const { components, nets } = (await req.json()) as {
      components?: Array<{ id: string; footprint?: string; currentDrawn?: number }>;
      nets?: Array<{
        name: string;
        pins?: Array<{ componentId: string; pinName: string }>;
        vias?: unknown[];
      }>;
    };

    if (!Array.isArray(components) || !Array.isArray(nets)) {
      return NextResponse.json({ error: 'components and nets required' }, { status: 400 });
    }

    const result = analyzeRealState(components, nets);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[SIMULATION] Error:', error);
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 });
  }
}
