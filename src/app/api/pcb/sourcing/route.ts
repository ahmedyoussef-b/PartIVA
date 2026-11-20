import { NextResponse } from 'next/server';
import { searchComponents, getBomCost, findAlternatives } from '@/lib/pcb/sourcing';
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
    const body = await req.json();
    const { action, query, components, componentId } = body as {
      action: 'search' | 'bomCost' | 'alternatives';
      query?: string;
      components?: Array<{ name: string; quantity: number }>;
      componentId?: string;
    };

    switch (action) {
      case 'search':
        if (!query) {
          return NextResponse.json({ error: 'query requis' }, { status: 400 });
        }
        return NextResponse.json({ results: searchComponents(query) });

      case 'bomCost':
        if (!components || !Array.isArray(components)) {
          return NextResponse.json({ error: 'components requis' }, { status: 400 });
        }
        return NextResponse.json(getBomCost(components));

      case 'alternatives':
        if (!componentId) {
          return NextResponse.json({ error: 'componentId requis' }, { status: 400 });
        }
        return NextResponse.json({ alternatives: findAlternatives(componentId) });

      default:
        return NextResponse.json({ error: 'action inconnue' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
