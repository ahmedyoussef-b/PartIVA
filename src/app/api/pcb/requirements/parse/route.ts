import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callGroq } from '@/lib/ai/groq-client';
import type { RequirementAnswer } from '@/lib/pcb/types';
import { PcbEnrichmentSchema } from '@/lib/pcb/requirement-schema';
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
    const { projectId, answers } = body as {
      projectId?: string;
      answers: RequirementAnswer[];
    };

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'answers requis' }, { status: 400 });
    }

    // Créer le projet si absent
    let project = projectId
      ? await prisma.pcbProject.findUnique({ where: { id: projectId } })
      : null;

    if (!project) {
      project = await prisma.pcbProject.create({
        data: { name: 'Nouveau projet PCB', status: 'draft' },
      });
    }

    // Sauvegarder le formulaire
    const form = await prisma.requirementForm.create({
      data: {
        projectId: project.id,
        blocks: JSON.stringify(answers),
      },
    });

    // Sauvegarder les réponses
    for (const a of answers) {
      await prisma.requirementAnswer.create({
        data: {
          formId: form.id,
          blockId: a.blockId,
          questionId: a.questionId,
          answer: a.answer,
          status: a.status,
        },
      });
    }

    // Enrichissement LLM (optionnel — si GROQ_API_KEY présente)
    let llmError: string | undefined;
    try {
      const prompt = `Tu es un ingénieur électronique. Analyse ces exigences et propose des précisions techniques : ${JSON.stringify(answers)}. Réponds UNIQUEMENT en JSON valide, sans markdown, avec la structure { "enrichments": [ { "questionId": "...", "suggestion": "...", "status": "proposed" } ] }.`;
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        llmError = 'GROQ_API_KEY non configurée';
      } else {
        const llmRes = await callGroq([{ role: 'user', content: prompt }], apiKey, {
          model: process.env.GROQ_MODEL,
          temperature: 0.2,
          maxTokens: 4096,
          timeout: 30000,
          responseFormat: 'json_object',
        });

        let parsed: unknown;
        try {
          parsed = JSON.parse(llmRes.content);
        } catch {
          llmError = 'Réponse LLM non-JSON';
        }

        if (llmError === undefined) {
          const validated = PcbEnrichmentSchema.safeParse(parsed);
          llmError = validated.success ? undefined : 'Schéma LLM invalide';
        }
      }
    } catch (e) {
      llmError = e instanceof Error ? e.message : 'LLM indisponible';
    }

    return NextResponse.json({
      projectId: project.id,
      formId: form.id,
      answerCount: answers.length,
      llmError,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
