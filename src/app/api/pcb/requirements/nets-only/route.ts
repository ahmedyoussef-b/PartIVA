import { NextResponse } from 'next/server';
import { callGroq, hasLlmProvider } from '@/lib/ai/groq-client';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { acquireLlmGuard, hashKey } from '@/lib/utils/llm-guard';
import { getLlmCacheAsync, setLlmCacheAsync } from '@/lib/utils/llm-cache';

export const runtime = 'nodejs';

interface NetsOnlyResult {
  nets: { name: string; pins: string[] }[];
}

function normalizePins(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      if (typeof p === 'string') return p.trim();
      if (p && typeof p === 'object') {
        const o = p as Record<string, unknown>;
        const ref = String(o.ref ?? o.reference ?? o.component ?? '').trim();
        const pin = String(o.pin ?? o.number ?? o.name ?? '').trim();
        return ref && pin ? `${ref}.${pin}` : '';
      }
      return '';
    })
    .filter((p) => /^[A-Za-z0-9_]+\.[^\s]+$/.test(p));
}

function parseNets(raw: string): { name: string; pins: string[] }[] {
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : raw) as Record<string, unknown>;
  const candidates = Array.isArray(parsed.nets)
    ? parsed.nets
    : Array.isArray(parsed.netlist)
      ? parsed.netlist
      : [];
  const nets: { name: string; pins: string[] }[] = [];
  for (const item of candidates) {
    if (!item || typeof item !== 'object') continue;
    const net = item as Record<string, unknown>;
    const name = typeof net.name === 'string' ? net.name.trim() : '';
    const pins = normalizePins(net.pins);
    if (name && pins.length >= 2) nets.push({ name, pins });
  }
  return nets;
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId) {
    return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  }

  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: { id: true, sourcingCache: true, description: true },
  });
  if (!project) {
    return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
  }

  const components = await prisma.pcbComponent.findMany({
    where: { projectId },
    select: { reference: true, name: true, footprint: true },
    orderBy: { reference: 'asc' },
  });
  if (components.length === 0) {
    return NextResponse.json({ error: 'Aucun composant trouvé pour ce projet' }, { status: 400 });
  }
  if (!hasLlmProvider()) {
    return NextResponse.json({ error: 'Aucun fournisseur LLM configuré' }, { status: 503 });
  }

  const componentList = components
    .map((c) => `${c.reference} (${String(c.name || '').slice(0, 40)})`)
    .join(', ')
    .slice(0, 2500);
  const cacheKey = `pcb:nets-only:${hashKey(`${projectId}|${componentList}|${project.description ?? ''}`)}`;
  const cached = await getLlmCacheAsync<NetsOnlyResult>(cacheKey);
  if (cached) {
    return NextResponse.json({ ok: true, nets: cached.nets, cached: true });
  }

  const guard = acquireLlmGuard(cacheKey);
  if (!guard.ok) {
    return NextResponse.json({ error: 'Génération des nets déjà en cours' }, { status: 429 });
  }

  try {
    const prompt = `Tu es un ingénieur en électronique. Voici la liste des composants d'une carte PCB :
[${componentList}]

Génère UNIQUEMENT un objet JSON avec la clé "nets". Organise ta réflexion par blocs fonctionnels :
1. ALIMENTATION : relie le régulateur à ses condensateurs et au connecteur d'entrée (ex. U1, C1, C2, J1). Inclus le net GND.
2. MICROCONTRÔLEUR : relie le MCU à son cristal et à ses condensateurs de découplage (ex. U2, Y1, C3). Inclus le net GND.
3. COMMUNICATION : relie le transceiver RS-485 à son connecteur (ex. U3, J4). Inclus le net GND.
4. ANALOGIQUE : si une sortie analogique existe, relie-la au MCU et à son connecteur.

Adapte ces exemples de références à la liste réelle fournie ci-dessus.

RÈGLES STRICTES :
- Tu DOIS inclure un net nommé "GND" qui relie TOUS les composants ayant une broche de masse.
- Tu DOIS inclure au moins un net d'alimentation (ex. "VCC_5V").
- Utilise EXACTEMENT le format "REF.PIN" (ex. "U1.1", "C1.2").
- Ne génère AUCUN texte, commentaire ou explication en dehors du JSON.

Format attendu :
{"nets":[{"name":"GND","pins":["U1.2","C1.2","U2.16"]},{"name":"VCC_5V","pins":["U1.1","C1.1","U2.4"]}]}`;

    const response = await callGroq([{ role: 'user', content: prompt }], undefined, {
      temperature: 0,
      maxTokens: 1536,
      timeout: 30000,
      responseFormat: 'json_object',
    });

    let nets: { name: string; pins: string[] }[];
    try {
      nets = parseNets(response.content);
    } catch {
      console.warn('[NETS-ONLY] JSON invalide renvoyé par le LLM');
      return NextResponse.json({ error: 'JSON invalide du LLM' }, { status: 502 });
    }
    if (nets.length === 0) {
      console.warn('[NETS-ONLY] Aucun net exploitable dans la réponse LLM');
      return NextResponse.json({ error: 'Aucun net exploitable généré' }, { status: 502 });
    }

    await prisma.pcbNet.deleteMany({ where: { projectId } });
    await prisma.pcbNet.createMany({
      data: nets.map((n) => ({
        projectId,
        name: n.name,
        pins: n.pins as object,
        status: 'proposed',
      })),
    });

    const previousCache = project.sourcingCache as Record<string, unknown> | null;
    await prisma.pcbProject.update({
      where: { id: projectId },
      data: { sourcingCache: { ...(previousCache ?? {}), nets, cacheVersion: 2 } as object },
    });

    await setLlmCacheAsync(cacheKey, { nets });
    console.info('[NETS-ONLY] Nets générés', {
      projectId,
      count: nets.length,
      names: nets.map((n) => n.name),
    });
    return NextResponse.json({ ok: true, nets, count: nets.length, cached: false });
  } catch (error) {
    console.error('[NETS-ONLY] Erreur', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 },
    );
  } finally {
    guard.release();
  }
}
