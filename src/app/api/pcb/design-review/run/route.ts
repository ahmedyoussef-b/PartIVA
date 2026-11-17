import { NextResponse } from 'next/server';
import { runDesignReview } from '@/lib/pcb/design-review-engine';

export async function POST(req: Request) {
  try {
    const { components, nets } = (await req.json()) as {
      components?: Array<{
        id: string;
        refDes?: string;
        name?: string;
        type?: string;
        footprint?: string;
      }>;
      nets?: Array<{ name: string; pins?: Array<{ componentId: string; pinName: string }> }>;
    };

    if (!Array.isArray(components) || !Array.isArray(nets)) {
      return NextResponse.json({ error: 'components and nets must be arrays' }, { status: 400 });
    }

    const report = runDesignReview(components, nets);
    return NextResponse.json(report);
  } catch (error) {
    console.error('[DESIGN-REVIEW] Error:', error);
    return NextResponse.json({ error: 'Design review failed' }, { status: 500 });
  }
}
