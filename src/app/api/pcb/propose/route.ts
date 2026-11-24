import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { proposeFromRequirements } from '@/lib/pcb/ai-engine';
import type { RequirementAnswer } from '@/lib/pcb/types';
import { requireAdmin } from '@/lib/auth-admin';
import { acquireLlmGuard, hashKey } from '@/lib/utils/llm-guard';
import { getLlmCacheAsync, setLlmCacheAsync } from '@/lib/utils/llm-cache';

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
    const { answers } = body as { answers: RequirementAnswer[] };
    const projectId = typeof body?.projectId === 'string' ? body.projectId.trim() : '';

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'answers requis' }, { status: 400 });
    }

    const cacheKey = `pcb:propose:${hashKey(JSON.stringify(answers))}`;
    const cached = await getLlmCacheAsync<{ proposals: unknown[] }>(cacheKey);
    if (cached) {
      return NextResponse.json({ proposals: cached.proposals, cached: true });
    }

    const guard = acquireLlmGuard(cacheKey);
    if (!guard.ok) {
      return NextResponse.json({ error: 'Proposition déjà en cours' }, { status: 429 });
    }

    try {
      const result = await proposeFromRequirements(answers);

      if (!projectId || result.proposals.length === 0) {
        return NextResponse.json(result);
      }

      // B.4.1 — persistance des propositions (status pending)
      await prisma.pcbProposal.createMany({
        data: result.proposals.map((p) => ({
          projectId,
          action: p.action,
          target: p.target,
          payload: p.payload as Prisma.InputJsonValue,
          reason: p.reason ?? null,
          status: 'pending',
          requiresValidation: true,
        })),
      });

      const saved = await prisma.pcbProposal.findMany({
        where: { projectId, status: 'pending' },
        orderBy: { createdAt: 'asc' },
      });

      console.info('[PCB:PROPOSE] Propositions persistées', { projectId, count: saved.length });
      await setLlmCacheAsync(cacheKey, { proposals: saved });
      return NextResponse.json({ proposals: saved });
    } finally {
      guard.release();
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
