import { NextResponse } from 'next/server';
import { proposeFromRequirements } from '@/lib/pcb/ai-engine';
import type { RequirementAnswer } from '@/lib/pcb/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { answers } = body as { answers: RequirementAnswer[] };

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'answers requis' }, { status: 400 });
    }

    const result = await proposeFromRequirements(answers);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
