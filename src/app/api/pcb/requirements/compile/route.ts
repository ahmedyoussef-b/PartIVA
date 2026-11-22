import { NextResponse } from 'next/server';
import { callGroq } from '@/lib/ai/groq-client';
import { requireAdmin } from '@/lib/auth-admin';
import { requirementBlocks } from '@/lib/pcb/requirement-blocks';
import type { RequirementAnswer } from '@/lib/pcb/types';

export const runtime = 'nodejs';

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
  if (!description) {
    return NextResponse.json({ error: 'description requise' }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY non configurée' }, { status: 503 });
  }

  const questionList = buildQuestionList();

  const prompt = `Tu es un ingénieur électronique senior. À partir de la description libre d'une carte électronique, compile une description technique structurée et COMPLÈTE, couvrant obligatoirement les 6 catégories du cahier des charges, puis remplis les champs du formulaire.

DESCRIPTION LIBRE :
${description}

CHAMPS À REMPLIR (blockId / questionId : libellé) :
${questionList}

CATÉGORIES À COUVRIR (les 6 sont obligatoires) :
1. Usage : type d'usage, température de fonctionnement, environnement, durée de vie.
2. Fonction : fonctions principales, interfaces d'entrée/sortie, communications, alimentation (tension, courant, source).
3. Traitement : complexité (logique simple / microcontrôleur / SoC / FPGA), temps réel, mémoire, consommation.
4. Mécanique : dimensions max (L×l×H), fixation, position des connecteurs, esthétique.
5. Fabrication : quantité prévue, budget par carte, contraintes de fabrication, délai souhaité.
6. Qualité : tests fonctionnels, fiabilité, normes (CE, FCC, RoHS).

Règles pour la description compilée ("compiled") :
- Rédige un paragraphe structuré de 10 à 18 phrases couvrant explicitement les 6 catégories.
- Pour chaque information non fournie explicitement par la description libre, déduis une valeur raisonnable et typique pour une carte de ce type, et indique-la clairement (ex. "Température de fonctionnement estimée : -20 à +70 °C (déduit)").
- Ne laisse aucune catégorie vide : si une donnée manque, propose une valeur typique et marque-la comme déduite.
- Sois exhaustif : mentionne tension, courant, dimensions, quantité, environnement, tests, normes.

Règles pour les answers :
- Remplis un MAXIMUM de champs, y compris par déduction raisonnable. Omettre un champ n'est acceptable que si aucune déduction n'est possible.
- Les multiselect (inputs, outputs, communications, standards) : liste de valeurs séparées par des virgules, parmi les options données.
- Les select (usage_type, complexity, manufacturer) : une seule valeur parmi les options.
- Les checkbox (realtime) : "oui" ou "non".
- Les number (quantity) : un nombre.
- status = "proposed" pour toutes.

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "compiled": "description technique structurée couvrant les 6 catégories, 10 à 18 phrases",
  "answers": [
    { "blockId": "...", "questionId": "...", "answer": "valeur", "status": "proposed" }
  ]
}`;

  try {
    const llmRes = await callGroq([{ role: 'user', content: prompt }], apiKey, {
      model: process.env.GROQ_MODEL,
      temperature: 0.15,
      maxTokens: 4096,
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
    const compiled = typeof obj.compiled === 'string' ? obj.compiled.trim() : '';
    const rawAnswers = Array.isArray(obj.answers) ? obj.answers : [];

    const validQuestionIds = new Set<string>();
    for (const block of requirementBlocks) {
      for (const q of block.questions) validQuestionIds.add(q.id);
    }

    const answers: RequirementAnswer[] = [];
    for (const a of rawAnswers) {
      if (!a || typeof a !== 'object') continue;
      const item = a as Record<string, unknown>;
      const blockId = typeof item.blockId === 'string' ? item.blockId : '';
      const questionId = typeof item.questionId === 'string' ? item.questionId : '';
      const answer = typeof item.answer === 'string' ? item.answer.trim() : '';
      if (!blockId || !questionId || !answer) continue;
      if (!validQuestionIds.has(questionId)) continue;
      answers.push({ blockId, questionId, answer, status: 'proposed' });
    }

    return NextResponse.json({ compiled, answers, count: answers.length });
  } catch (e) {
    console.error('[PCB:COMPILE] Erreur LLM', e);
    const message =
      e instanceof Error
        ? e.message
        : typeof e === 'object' && e && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Erreur LLM';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
