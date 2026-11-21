import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';
import { callGroq } from '@/lib/ai/groq-client';
import { PcbRequirementSchema } from '@/lib/pcb/requirement-schema';
import { normalizeRequirements, type NormalizedRequirement } from '@/lib/pcb/analyze-mapping';

export const runtime = 'nodejs';

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

  console.info('[PCB:ANALYZE] Requête reçue', { timestamp: new Date().toISOString(), projectId });

  // 3. Résoudre le projet et le CDC client (requestId = scalaire, pas de relation)
  const project = await prisma.pcbProject.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
  }

  const clientRequest = project.requestId
    ? await prisma.request.findUnique({ where: { id: project.requestId } })
    : null;

  const cdc = clientRequest?.partDescription?.trim();
  if (!cdc) {
    return NextResponse.json(
      { error: 'Aucun cahier des charges client rattaché' },
      { status: 400 },
    );
  }

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

  const candidateBlock =
    candidates.length > 0
      ? `\nComposants disponibles dans le catalogue (utilise-les si pertinents, sinon propose des composants génériques) :\n${candidates
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
- key = nom court du champ (ex. "Tension d'alimentation", "Température max").
- value = valeur extraite ou déduite du cahier des charges.
- status = "proposed" par défaut.
- source = extrait EXACT du cahier des charges (5 à 200 caractères) qui justifie la valeur. Copier les mots du client, ne pas paraphraser.
- Si la valeur est déduite et non écrite dans le cahier des charges, mettre source = "inféré" ET status = "to_verify".
- Si un composant du catalogue est utilisé, source peut être "catalog:<id du composant>".
- Ne jamais inventer une citation : en cas de doute, "inféré".
- Si des composants du catalogue sont fournis, privilégie-les (indique leur nom exact).
- Propose au moins un champ par catégorie pertinente.
`;

  // 5. Appel LLM
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY non configurée' }, { status: 502 });
  }

  let requirements: NormalizedRequirement[] = [];

  try {
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
      console.error('[PCB:ANALYZE] Réponse LLM non-JSON');
      return NextResponse.json({ error: 'Réponse LLM non-JSON' }, { status: 502 });
    }

    const validated = PcbRequirementSchema.safeParse(parsed);
    if (!validated.success) {
      console.error('[PCB:ANALYZE] Schéma LLM invalide', validated.error.flatten());
      return NextResponse.json({ error: 'Schéma LLM invalide' }, { status: 502 });
    }

    requirements = normalizeRequirements(validated.data.requirements);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur LLM';
    console.error('[PCB:ANALYZE] Erreur LLM', message);
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

  console.info('[PCB:ANALYZE] Exigences', {
    total: requirements.length,
    withSource: requirements.filter((r) => r.source && r.source !== 'inféré').length,
    toVerify: requirements.filter((r) => r.status === 'to_verify').length,
  });

  // 7. Relire et renvoyer
  const saved = await prisma.pcbRequirement.findMany({
    where: { projectId },
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  });

  console.info('[PCB:ANALYZE] Résultat', { count: saved.length });
  return NextResponse.json({ projectId, requirements: saved, count: saved.length });
}
