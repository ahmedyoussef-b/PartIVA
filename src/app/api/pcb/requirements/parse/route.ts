import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callPcbLlm } from '@/lib/pcb/llm-client';
import type { RequirementAnswer } from '@/lib/pcb/types';

export async function POST(req: Request) {
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
      const prompt = `Tu es un ingénieur électronique. Analyse ces exigences et propose des précisions techniques : ${JSON.stringify(answers)}. Réponds en JSON avec un tableau "enrichments" de {questionId, suggestion, status}.`;
      const llmRes = await callPcbLlm(prompt);
      if (llmRes.error) llmError = llmRes.error;
    } catch {
      llmError = 'LLM indisponible';
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
