import { NextResponse } from 'next/server';
import { runDesignReview } from '@/lib/pcb/design-review';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { components, nets } = body as {
      components?: unknown[];
      nets?: unknown[];
    };

    if (!components || !Array.isArray(components)) {
      return NextResponse.json({ error: 'components requis' }, { status: 400 });
    }
    if (!nets || !Array.isArray(nets)) {
      return NextResponse.json({ error: 'nets requis' }, { status: 400 });
    }

    const result = runDesignReview(
      components as Parameters<typeof runDesignReview>[0],
      nets as Parameters<typeof runDesignReview>[1],
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
