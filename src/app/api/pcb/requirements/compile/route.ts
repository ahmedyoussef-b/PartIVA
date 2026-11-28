import { NextResponse } from 'next/server';
import { callGroq, hasLlmProvider } from '@/lib/ai/groq-client';
import { requireAdmin } from '@/lib/auth-admin';
import { requirementBlocks } from '@/lib/pcb/requirement-blocks';
import {
  checkConstraintViolations,
  extractNegativeConstraints,
  reconcileConflicts,
} from '@/lib/pcb/negative-constraints';
import type { CompileConflict, CompileViolation, RequirementAnswer } from '@/lib/pcb/types';
import { acquireLlmGuard, hashKey } from '@/lib/utils/llm-guard';
import { getLlmCacheAsync, setLlmCacheAsync } from '@/lib/utils/llm-cache';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface CompileResult {
  compiled: string;
  answers: RequirementAnswer[];
  constraints: string[];
  conflicts: CompileConflict[];
  violations: CompileViolation[];
  needsReview: boolean;
  count: number;
}

function buildQuestionList(): string {
  const lines: string[] = [];
  for (const block of requirementBlocks) {
    if (block.id === 'summary') continue;
    for (const q of block.questions) {
      const opts = q.options ? ` (options: ${q.options.join(', ')})` : '';
      const req = q.required ? ' [obligatoire]' : '';
      lines.push(`- blockId="${block.id}", questionId="${q.id}" : ${q.label}${opts}${req}`);
    }
  }
  return lines.join('\n');
}

function buildPrompt(
  projectName: string,
  description: string,
  questionList: string,
  constraints: string[],
): string {
  const constraintBlock = constraints.length
    ? `INTERDICTIONS ABSOLUES (extraites mot pour mot du texte du client) :\n${constraints
        .map((c) => `- ${c}`)
        .join(
          '\n',
        )}\nCes éléments sont formellement exclus. Ne les réintroduis sous aucune forme, même pour satisfaire un autre besoin. Reproduisez-les telles quelles dans "compiled", mais n'écris jamais le terme interdit dans une affirmation positive. Si un besoin entre en conflit avec une interdiction, n'enfreins pas l'interdiction : ajoute le conflit dans "conflicts" (questionId, forbidden, need, explanation) et laisse le champ concerné non rempli.\n`
    : "Aucune interdiction explicite n'a été relevée dans le texte du client.";

  return `Tu es un ingénieur électronique senior. Tu EXTRAIS et STRUCTURES le cahier des charges rédigé par le client. Ce texte est la SEULE source de vérité.

NOM DU PROJET (contexte métier) :
${projectName || '(non renseigné)'}

DESCRIPTION LIBRE DU CLIENT :
${description}

CHAMPS DU FORMULAIRE (blockId / questionId : libellé) :
${questionList}

${constraintBlock}

RÈGLES D'EXTRACTION (impératives) :
- N'ajoute aucune information qui n'est pas présente dans le texte du client : ni valeur, ni composant, ni interface, ni tension, ni norme, ni test.
- N'infère aucune valeur « typique » ou « raisonnable ». Si une donnée manque, OMETS le champ : le serveur le marquera « À préciser ».
- Pour chaque catégorie non évoquée par le client, écris simplement « Non renseigné par le client » dans "compiled" — n'invente pas de contenu pour la remplir.
- Ne transforme pas une interdiction en spécification positive : « pas de Wi-Fi » reste une exclusion, jamais une fonctionnalité.
- Si une information est ambiguë ou contradictoire, ne choisis pas à la place du client : mentionne l'ambiguïté dans "compiled" et omets le champ.
- Exprime TOUS les prix, budgets et coûts présents dans le texte en dinars tunisiens (DT / TND). N'utilise JAMAIS d'euros (€) ni de dollars ($).
- Rédige "compiled" en 6 paragraphes courts, un par catégorie (usage, fonction, traitement, mécanique, fabrication, qualité), en citant uniquement ce que le client a écrit.

Règles pour les "answers" :
- Ne remplis que les champs dont la valeur est explicitement présente dans le texte client.
- Les multiselect (inputs, outputs, communications, standards) : liste de valeurs séparées par des virgules, parmi les options données.
- Les select (usage_type, complexity, manufacturer) : une seule valeur parmi les options.
- Les checkbox (realtime) : "oui" ou "non".
- Les number (quantity) : un nombre.
- status = "proposed" pour les champs extraits.

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "compiled": "description structurée des seules informations fournies par le client",
  "answers": [
    { "blockId": "...", "questionId": "...", "answer": "valeur", "status": "proposed" }
  ],
  "conflicts": [
    { "questionId": "...", "forbidden": "...", "need": "...", "explanation": "..." }
  ]
}`;
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ message }, { status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const description = typeof b.description === 'string' ? b.description.trim() : '';
  const projectName = typeof b.projectName === 'string' ? b.projectName.trim() : '';
  if (!description) {
    return NextResponse.json({ error: 'description requise' }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY?.trim() || undefined;
  if (!hasLlmProvider()) {
    return NextResponse.json({ error: 'Aucun fournisseur LLM configuré' }, { status: 503 });
  }

  const constraints = extractNegativeConstraints(description);
  const prompt = buildPrompt(projectName, description, buildQuestionList(), constraints);

  // v4 : prompt d'extraction + contraintes négatives + champs « À préciser ».
  const cacheKey = `pcb:compile:v4:${hashKey(`${projectName}|${description}`)}`;
  const cached = await getLlmCacheAsync<CompileResult>(cacheKey);
  if (cached) {
    console.info('[PCB:COMPILE] Cache hit');
    return NextResponse.json({ ...cached, cached: true });
  }

  const guard = acquireLlmGuard(cacheKey);
  if (!guard.ok) {
    return NextResponse.json({ error: 'Compilation déjà en cours' }, { status: 429 });
  }

  try {
    const llmRes = await callGroq([{ role: 'user', content: prompt }], apiKey, {
      model: process.env.GROQ_MODEL,
      temperature: 0,
      maxTokens: 2048,
      timeout: 30000,
      responseFormat: 'json_object',
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(llmRes.content);
    } catch {
      return NextResponse.json({ error: 'Réponse LLM non-JSON' }, { status: 502 });
    }

    const obj = (parsed ?? {}) as Record<string, unknown>;
    // Filet de sécurité : le LLM peut ignorer la règle DT -> convertir € en DT.
    const toDt = (text: string): string =>
      text
        .replace(/€/g, ' DT')
        .replace(/\bEUR\b/gi, 'DT')
        .replace(/\bUSD\b/gi, 'DT');
    const compiled =
      typeof obj.compiled === 'string' && obj.compiled.trim()
        ? toDt(obj.compiled).trim()
        : description;

    const questionToBlock = new Map<string, string>();
    const required: Array<{ blockId: string; questionId: string }> = [];
    for (const block of requirementBlocks) {
      if (block.id === 'summary') continue;
      for (const q of block.questions) {
        questionToBlock.set(q.id, block.id);
        if (q.required) required.push({ blockId: block.id, questionId: q.id });
      }
    }

    const answers: RequirementAnswer[] = [];
    const seen = new Set<string>();
    const rawAnswers = Array.isArray(obj.answers) ? obj.answers : [];
    for (const a of rawAnswers) {
      if (!a || typeof a !== 'object') continue;
      const item = a as Record<string, unknown>;
      const questionId = typeof item.questionId === 'string' ? item.questionId.trim() : '';
      const answer = typeof item.answer === 'string' ? toDt(item.answer).trim() : '';
      const blockId = questionToBlock.get(questionId);
      // Le blockId vient du référentiel serveur, pas du LLM.
      if (!blockId || !answer || seen.has(questionId)) continue;
      seen.add(questionId);
      answers.push({ blockId, questionId, answer, status: 'proposed' });
    }

    // Les champs requis non cités par le client ne sont pas devinés.
    for (const q of required) {
      if (seen.has(q.questionId)) continue;
      seen.add(q.questionId);
      answers.push({
        blockId: q.blockId,
        questionId: q.questionId,
        answer: 'À préciser',
        status: 'missing',
      });
    }

    const conflicts = reconcileConflicts(obj.conflicts, constraints).filter((c) =>
      questionToBlock.has(c.questionId),
    );
    for (const conflict of conflicts) {
      const existing = answers.find((a) => a.questionId === conflict.questionId);
      if (existing) existing.status = 'to_verify';
      else {
        const blockId = questionToBlock.get(conflict.questionId)!;
        answers.push({
          blockId,
          questionId: conflict.questionId,
          answer: 'À préciser',
          status: 'to_verify',
        });
      }
      seen.add(conflict.questionId);
    }

    const violations = checkConstraintViolations({ compiled, answers, constraints });
    for (const violation of violations) {
      const target = answers.find((a) => a.questionId === violation.questionId);
      if (target && target.status !== 'missing') target.status = 'to_verify';
    }

    const needsReview = violations.length > 0 || conflicts.length > 0;
    const result: CompileResult = {
      compiled,
      answers,
      constraints,
      conflicts,
      violations,
      needsReview,
      count: answers.length,
    };

    // Une compilation à revoir n'est pas mise en cache : l'utilisateur va la
    // corriger et la prochaine tentative doit repartir du texte client.
    if (!needsReview) await setLlmCacheAsync(cacheKey, result);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[PCB:COMPILE] Erreur LLM', e);
    const message =
      e instanceof Error
        ? e.message
        : typeof e === 'object' && e && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Erreur LLM';
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    guard.release();
  }
}
