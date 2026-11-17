import { NextResponse } from 'next/server';
import { parseErcReport, parseDrcReport } from '@/lib/pcb/erc-drc-parser';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, json } = body as {
      action: 'parseErc' | 'parseDrc';
      json: string;
    };

    if (!json) {
      return NextResponse.json({ error: 'json requis' }, { status: 400 });
    }

    let result;
    switch (action) {
      case 'parseErc':
        result = parseErcReport(json);
        break;
      case 'parseDrc':
        result = parseDrcReport(json);
        break;
      default:
        return NextResponse.json({ error: 'action inconnue' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
