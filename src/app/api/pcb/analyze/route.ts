import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';
import { callGroq, hasLlmProvider } from '@/lib/ai/groq-client';
import { PcbRequirementSchema } from '@/lib/pcb/requirement-schema';
import { normalizeRequirements, type NormalizedRequirement } from '@/lib/pcb/analyze-mapping';
import { assessCdcQuality } from '@/lib/pcb/cdc-quality';
import { mergePasses, type Divergence } from '@/lib/pcb/consensus';
import { buildRankPrompt, parseRankResponse, type RankCandidate } from '@/lib/pcb/rank-candidates';
import { acquireLlmGuard, hashKey } from '@/lib/utils/llm-guard';

export const runtime = 'nodejs';

async function callLLMRaw(prompt: string, apiKey?: string): Promise<string> {
  const llmRes = await callGroq([{ role: 'user', content: prompt }], apiKey, {
    model: process.env.GROQ_MODEL,
    temperature: 0.2,
    maxTokens: 1024,
    timeout: 30000,
    responseFormat: 'json_object',
  });
  return llmRes.content;
}

async function callLLM(prompt: string, apiKey?: string): Promise<NormalizedRequirement[]> {
  const llmRes = await callGroq([{ role: 'user', content: prompt }], apiKey, {
    model: process.env.GROQ_MODEL,
    temperature: 0.2,
    maxTokens: 2048,
    timeout: 30000,
    responseFormat: 'json_object',
  });

  const parsed = JSON.parse(llmRes.content) as unknown;
  const validated = PcbRequirementSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error('Schéma LLM invalide');
  }

  return normalizeRequirements(validated.data.requirements);
}

export async function POST(req: Request) {
  // 1. Auth
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ message }, { status });
  }

  // 2. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const projectId = typeof b.projectId === 'string' ? b.projectId.trim() : '';
  if (!projectId) {
    return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  }

  if (b.doublePass !== undefined && typeof b.doublePass !== 'boolean') {
    return NextResponse.json({ error: 'doublePass doit être un booléen' }, { status: 400 });
  }
  if (b.rankCandidates !== undefined && typeof b.rankCandidates !== 'boolean') {
    return NextResponse.json({ error: 'rankCandidates doit être un booléen' }, { status: 400 });
  }
  const doublePassFlag = b.doublePass === undefined ? false : (b.doublePass as boolean);
  const rankCandidatesFlag = b.rankCandidates === undefined ? false : (b.rankCandidates as boolean);
  const force = b.force === true;

  const guard = acquireLlmGuard(`pcb:analyze:${projectId}`);
  if (!guard.ok) {
    return NextResponse.json(
      { error: 'Analyse déjà en cours', retryAfterSeconds: 10 },
      { status: 429 },
    );
  }

  try {
    console.info('[PCB:ANALYZE] Requête reçue', { timestamp: new Date().toISOString(), projectId });

    // 3. Résoudre le projet et le CDC client (requestId = scalaire, pas de relation)
    const project = await prisma.pcbProject.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
    }

    const clientRequest = project.requestId
      ? await prisma.request.findUnique({ where: { id: project.requestId } })
      : null;

    const cdc = clientRequest?.partDescription?.trim() || project.description?.trim();
    if (!cdc) {
      return NextResponse.json(
        { error: 'Aucun cahier des charges client rattaché' },
        { status: 400 },
      );
    }
    const cdcHash = hashKey(cdc);

    // 3 bis. Recherche de composants candidats dans le catalogue (contexte LLM)
    const keywords = cdc
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5);

    const candidateMap = new Map<
      string,
      {
        id: string;
        name: string;
        category: string;
        footprint: string | null;
        supplier: string | null;
      }
    >();

    for (const kw of keywords) {
      const results = await prisma.componentCatalog.findMany({
        where: {
          OR: [
            { name: { contains: kw, mode: 'insensitive' } },
            { category: { contains: kw, mode: 'insensitive' } },
            { footprint: { contains: kw, mode: 'insensitive' } },
            { supplierRef: { contains: kw, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          category: true,
          footprint: true,
          supplier: true,
          supplierRef: true,
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      });
      for (const r of results) candidateMap.set(r.id, r);
    }

    const candidates = Array.from(candidateMap.values()).slice(0, 10);
    console.info('[PCB:ANALYZE] Candidats catalogue', { count: candidates.length });

    // 3 bis. Réordonnancement IA (si double passe active ET > 5 candidats)
    const shouldRank = rankCandidatesFlag && doublePassFlag && candidates.length > 5;
    let selected: RankCandidate[] = candidates.slice(0, 5);
    let rankedStatus: 'ok' | 'fallback' | 'skipped' = 'skipped';

    if (shouldRank) {
      const apiKey = process.env.GROQ_API_KEY?.trim() || undefined;
      if (!hasLlmProvider()) {
        rankedStatus = 'fallback';
      } else {
        try {
          const raw = await callLLMRaw(buildRankPrompt(cdc, candidates), apiKey);
          const rank = parseRankResponse(raw, candidates);
          if (!rank.parsed) {
            console.warn('[PCB:ANALYZE] Classement non interprete');
            rankedStatus = 'fallback';
          } else {
            selected = rank.ranked.slice(0, 5);
            rankedStatus = 'ok';
          }
        } catch (e) {
          console.warn('[PCB:ANALYZE] Classement echoue', {
            error: e instanceof Error ? e.message : String(e),
          });
          rankedStatus = 'fallback';
        }
      }
    }

    console.info('[PCB:ANALYZE] Classement', { ranked: rankedStatus, selected: selected.length });

    const candidateBlock =
      selected.length > 0
        ? `\nComposants disponibles dans le catalogue (utilise-les si pertinents, sinon propose des composants génériques) :\n${selected
            .map(
              (c) =>
                `- ${c.name} (${c.category}) — empreinte: ${c.footprint ?? 'N/A'}, fournisseur: ${c.supplier ?? 'N/A'}`,
            )
            .join('\n')}\n`
        : '';

    // 4. Prompt LLM
    const prompt = `Tu es un expert en conception de cartes électroniques PCB.
Analyse le cahier des charges client suivant et produis une liste d'exigences techniques structurées.

Cahier des charges :
${cdc}
${candidateBlock}

Fonction principale : ${clientRequest?.partFunction ?? 'non précisée'}
Matériau suspecté : ${clientRequest?.suspectedMaterial ?? 'non précisé'}
Quantité : ${clientRequest?.quantity ?? 'non précisée'}

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "requirements": [
    { "category": "usage|function|processing|mechanical|manufacturing|quality", "key": "nom du champ", "value": "valeur", "status": "proposed", "source": "..." }
  ]
}

Règles :
- category doit être l'une des 6 valeurs exactes.
- key = nom court du champ, choisi de préférence dans cette liste canonique (pour assurer la cohérence entre les deux passes) :
  Usage : Type d'usage, Température de fonctionnement, Environnement, Durée de vie.
  Fonction : Fonctions principales, Interfaces d'entrée, Interfaces de sortie, Communications, Alimentation.
  Traitement : Complexité du traitement, Temps réel, Mémoire, Consommation.
  Mécanique : Dimensions max, Fixation, Position des connecteurs, Esthétique.
  Fabrication : Quantité, Budget, Fabricant, Délai.
  Qualité : Tests fonctionnels, Fiabilité, Normes.
  Si un champ n'est pas dans la liste, utilise un nom court et stable.
- value = valeur extraite ou déduite du cahier des charges.
- status = "proposed" par défaut.
- source = extrait EXACT du cahier des charges (5 à 200 caractères) qui justifie la valeur. Copier les mots du client, ne pas paraphraser.
- Si la valeur est déduite et non écrite dans le cahier des charges, mettre source = "inféré" ET status = "to_verify".
- Si un composant du catalogue est utilisé, source peut être "catalog:<id du composant>".
- Ne jamais inventer une citation : en cas de doute, "inféré".
- Si des composants du catalogue sont fournis, privilégie-les (indique leur nom exact).
- Propose au moins un champ par catégorie pertinente. Si une catégorie n'est pas couverte par le cahier des charges, déduis une valeur raisonnable et mets source = "inféré" et status = "to_verify".
`;

    // 4bis. Idempotence — si des exigences existent déjà et qu'aucun `force` n'est demandé,
    // on renvoie l'existant sans rappeler le LLM (économie de quota).
    if (!force) {
      const existing = await prisma.pcbRequirement.findMany({
        where: { projectId },
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });
      if (existing.length > 0 && project.cdcHash === cdcHash) {
        const quality = assessCdcQuality(
          existing.map((r) => ({
            category: r.category,
            key: r.key,
            value: r.value,
            source: r.source,
            status: r.status,
          })),
        );
        console.info('[PCB:ANALYZE] Cache hit', { projectId, count: existing.length });
        return NextResponse.json({
          projectId,
          requirements: existing,
          count: existing.length,
          quality,
          doublePass: 'skipped',
          divergences: [],
          onlyInPass1: [],
          onlyInPass2: [],
          ranked: 'skipped',
          selectedCandidateIds: [],
          cached: true,
        });
      }
    }

    // 5. Appel(s) LLM — séquentiels (rate limit)
    const apiKey = process.env.GROQ_API_KEY?.trim() || undefined;
    if (!hasLlmProvider()) {
      return NextResponse.json({ error: 'Aucun fournisseur LLM configuré' }, { status: 502 });
    }

    let requirements: NormalizedRequirement[] = [];
    let quality = assessCdcQuality([]);
    let divergences: Divergence[] = [];
    let onlyInPass1: string[] = [];
    let onlyInPass2: string[] = [];
    let doublePassStatus: 'ok' | 'disabled' | 'failed' = 'disabled';

    try {
      const pass1 = await callLLM(prompt, apiKey);

      if (!doublePassFlag) {
        requirements = pass1;
        doublePassStatus = 'disabled';
      } else {
        try {
          const pass2 = await callLLM(prompt, apiKey);
          const merged = mergePasses(pass1, pass2);
          requirements = normalizeRequirements(merged.requirements);
          divergences = merged.divergences;
          onlyInPass1 = merged.onlyInPass1;
          onlyInPass2 = merged.onlyInPass2;
          doublePassStatus = 'ok';
        } catch (e) {
          console.warn('[PCB:ANALYZE] Seconde passe échouée', {
            error: e instanceof Error ? e.message : String(e),
          });
          requirements = pass1;
          doublePassStatus = 'failed';
        }
      }

      quality = assessCdcQuality(requirements);
    } catch (e) {
      console.error('[PCB:ANALYZE] Erreur LLM', e);
      const message =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e && 'message' in e
            ? String((e as { message: unknown }).message)
            : 'Erreur LLM';
      return NextResponse.json({ error: message }, { status: 502 });
    }

    // 6. Idempotence : deleteMany puis createMany
    await prisma.pcbRequirement.deleteMany({ where: { projectId } });
    if (requirements.length > 0) {
      await prisma.pcbRequirement.createMany({
        data: requirements.map((r) => ({
          projectId,
          category: r.category,
          key: r.key,
          value: r.value,
          status: r.status,
          source: r.source,
        })),
      });
    }
    await prisma.pcbProject.update({ where: { id: projectId }, data: { cdcHash } });

    console.info('[PCB:ANALYZE] Exigences', {
      total: requirements.length,
      withSource: requirements.filter((r) => r.source && r.source !== 'inféré').length,
      toVerify: requirements.filter((r) => r.status === 'to_verify').length,
      completeness: quality.completeness.score,
      conflicts: quality.conflicts.length,
      divergences: divergences.length,
      dropped: onlyInPass1.length + onlyInPass2.length,
      doublePass: doublePassStatus,
      ranked: rankedStatus,
      selected: selected.length,
    });

    // 7. Relire et renvoyer
    const saved = await prisma.pcbRequirement.findMany({
      where: { projectId },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    console.info('[PCB:ANALYZE] Résultat', { count: saved.length });
    return NextResponse.json({
      projectId,
      requirements: saved,
      count: saved.length,
      quality,
      doublePass: doublePassStatus,
      divergences,
      onlyInPass1,
      onlyInPass2,
      ranked: rankedStatus,
      selectedCandidateIds: selected.map((c) => c.id),
    });
  } finally {
    guard.release();
  }
}
