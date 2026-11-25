import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { RequirementAnswer } from '@/lib/pcb/types';
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
    const { projectId, answers, description, status, projectName } = body as {
      projectId?: string;
      answers: RequirementAnswer[];
      description?: string;
      status?: string;
      projectName?: string;
    };

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'answers requis' }, { status: 400 });
    }
    const hasDescription = typeof description === 'string' && description.trim().length > 0;
    if (answers.length === 0 && !hasDescription) {
      return NextResponse.json(
        { error: 'Aucune réponse et aucune description : projet vide refusé' },
        { status: 400 },
      );
    }

    // Créer le projet si absent
    let project = projectId
      ? await prisma.pcbProject.findUnique({ where: { id: projectId } })
      : null;

    const desc = typeof description === 'string' ? description.trim() : undefined;
    const name =
      typeof projectName === 'string' && projectName.trim() ? projectName.trim() : undefined;
    const allowedStatuses = new Set([
      'draft',
      'requirements_validated',
      'design_validated',
      'manufacturing_ready',
    ]);
    const nextStatus =
      typeof status === 'string' && allowedStatuses.has(status) ? status : undefined;

    if (!project) {
      project = await prisma.pcbProject.create({
        data: {
          name: name ?? 'Nouveau projet PCB',
          status: nextStatus ?? 'draft',
          description: desc,
        },
      });
    } else {
      const data: { description?: string; status?: string; name?: string } = {};
      if (name) data.name = name;
      if (desc) data.description = desc;
      if (nextStatus) data.status = nextStatus;
      if (Object.keys(data).length > 0) {
        project = await prisma.pcbProject.update({
          where: { id: project.id },
          data,
        });
      }
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

    // Aucun appel LLM ici : l'enrichissement n'était ni persisté ni renvoyé.
    // L'analyse du CDC reste concentrée dans /api/pcb/analyze (cache + garde).
    return NextResponse.json({
      projectId: project.id,
      formId: form.id,
      answerCount: answers.length,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
