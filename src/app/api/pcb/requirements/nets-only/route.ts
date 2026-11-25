import { NextResponse } from 'next/server';
import { callGroq, hasLlmProvider } from '@/lib/ai/groq-client';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { acquireLlmGuard, hashKey } from '@/lib/utils/llm-guard';
import { getLlmCacheAsync, setLlmCacheAsync } from '@/lib/utils/llm-cache';
import { getFootprintPadNumbers } from '@/lib/pcb/kicad-footprints';
import { inferPlacementRole } from '@/lib/pcb/placement';

export const runtime = 'nodejs';

type NetSource = 'llm' | 'heuristic';

interface ScoredNet {
  name: string;
  pins: string[];
  source: NetSource;
}

interface NetsOnlyResult {
  nets: ScoredNet[];
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

/**
 * Phase 1.2 — complète les nets omis par le LLM à partir des rôles déduits.
 * N'utilise QUE des pads réellement présents dans les footprints, et marque
 * chaque net inféré `heuristic` pour que l'admin puisse le vérifier.
 */
function buildHeuristicNets(
  components: Array<{ reference: string; name: string | null; footprint: string | null }>,
  padsByRef: Map<string, string[]>,
  coveredRefs: Set<string>,
  usedNames: Set<string>,
): ScoredNet[] {
  const result: ScoredNet[] = [];
  const roleOf = (c: { reference: string; name: string | null; footprint: string | null }) =>
    inferPlacementRole({ reference: c.reference, value: c.name, footprint: c.footprint });

  const connectors = components.filter((c) => roleOf(c) === 'connector');
  const findConnector = (pattern: RegExp) =>
    connectors.find((c) => pattern.test(`${c.name ?? ''} ${c.footprint ?? ''}`)) ?? connectors[0];

  const pushNet = (name: string, a: string, b: string) => {
    if (!a || !b || usedNames.has(name)) return;
    usedNames.add(name);
    result.push({ name, pins: [a, b], source: 'heuristic' });
  };

  for (const comp of components) {
    if (coveredRefs.has(comp.reference)) continue;
    const role = roleOf(comp);
    const ownPads = padsByRef.get(comp.reference) ?? [];
    if (!role || role === 'connector' || ownPads.length === 0) continue;

    if (role === 'serial') {
      const conn = findConnector(/rs.?485|modbus|db9|uart/i);
      const connPads = conn ? (padsByRef.get(conn.reference) ?? []) : [];
      if (conn && connPads.length > 0) {
        pushNet(
          'RS485_AUTO_A',
          `${comp.reference}.${ownPads[0]}`,
          `${conn.reference}.${connPads[0]}`,
        );
        if (ownPads[1] && connPads[1]) {
          pushNet(
            'RS485_AUTO_B',
            `${comp.reference}.${ownPads[1]}`,
            `${conn.reference}.${connPads[1]}`,
          );
        }
      }
    } else if (role === 'clock') {
      const mcu = components.find((c) => roleOf(c) === 'mcu');
      const mcuPads = mcu ? (padsByRef.get(mcu.reference) ?? []) : [];
      if (mcu && mcuPads.length > 0) {
        pushNet('CLK_AUTO', `${comp.reference}.${ownPads[0]}`, `${mcu.reference}.${mcuPads[0]}`);
      }
    } else if (role === 'regulator') {
      const conn = findConnector(/alim|power|24\s*v|vin|entr[eé]e/i);
      const connPads = conn ? (padsByRef.get(conn.reference) ?? []) : [];
      if (conn && connPads.length > 0) {
        pushNet('PWR_AUTO', `${comp.reference}.${ownPads[0]}`, `${conn.reference}.${connPads[0]}`);
      }
    }
  }
  return result;
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
  // v2 : le prompt hiérarchique produit une topologie plus riche. Invalider
  // les résultats de l'ancien prompt stockés en L2 avec la même clé.
  const cacheKey = `pcb:nets-only:v2:${hashKey(`${projectId}|${componentList}|${project.description ?? ''}`)}`;
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
      maxTokens: 3072,
      timeout: 30000,
      responseFormat: 'json_object',
    });

    let rawNets: { name: string; pins: string[] }[];
    try {
      rawNets = parseNets(response.content);
    } catch {
      console.warn('[NETS-ONLY] JSON invalide renvoyé par le LLM');
      return NextResponse.json({ error: 'JSON invalide du LLM' }, { status: 502 });
    }

    // Validation des pins contre les pads réels des footprints.
    const padsByRef = new Map<string, string[]>();
    for (const c of components) {
      const fp = String(c.footprint ?? '');
      const [lib, name] = fp.includes(':') ? fp.split(':', 2) : ['', fp];
      padsByRef.set(c.reference, getFootprintPadNumbers(lib ?? '', name ?? ''));
    }
    const validPins = new Set<string>();
    for (const [ref, pads] of padsByRef) {
      for (const pad of pads) validPins.add(`${ref}.${pad}`);
    }
    const llmNets: ScoredNet[] = rawNets
      .map((n) => ({
        name: n.name,
        pins: n.pins.filter((pin) => {
          const ref = pin.split('.')[0] ?? '';
          const readable = (padsByRef.get(ref) ?? []).length > 0;
          // Si le footprint est illisible, on ne supprime pas aveuglément.
          return !readable || validPins.has(pin);
        }),
        source: 'llm' as const,
      }))
      .filter((n) => n.pins.length >= 2);
    const droppedPins =
      rawNets.reduce((acc, n) => acc + n.pins.length, 0) -
      llmNets.reduce((acc, n) => acc + n.pins.length, 0);

    const coveredRefs = new Set(llmNets.flatMap((n) => n.pins.map((p) => p.split('.')[0]!)));
    const usedNames = new Set(llmNets.map((n) => n.name));
    const heuristicNets = buildHeuristicNets(components, padsByRef, coveredRefs, usedNames);
    const nets = [...llmNets, ...heuristicNets];
    if (nets.length === 0) {
      console.warn('[NETS-ONLY] Aucun net exploitable après validation');
      return NextResponse.json({ error: 'Aucun net exploitable généré' }, { status: 502 });
    }

    await prisma.pcbNet.deleteMany({ where: { projectId } });
    await prisma.pcbNet.createMany({
      data: nets.map((n) => ({
        projectId,
        name: n.name,
        pins: n.pins as object,
        source: n.source,
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
      droppedPins,
      heuristic: heuristicNets.length,
      names: nets.map((n) => n.name),
    });
    return NextResponse.json({
      ok: true,
      nets,
      count: nets.length,
      heuristicCount: heuristicNets.length,
      droppedPins,
      cached: false,
    });
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
