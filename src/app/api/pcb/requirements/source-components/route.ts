import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callGroq, hasLlmProvider } from '@/lib/ai/groq-client';
import { requireAdmin } from '@/lib/auth-admin';
import {
  getFootprintPadNumbers,
  getFootprintSize,
  resolveKicadFootprint,
  type FootprintResolution,
} from '@/lib/pcb/kicad-footprints';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';
import { acquireLlmGuard, hashKey } from '@/lib/utils/llm-guard';
import { LLM_NETLIST_EMPTY_CODE, NET_EMPTY_MESSAGE } from '@/lib/pcb/netlist-guidance';
import { validateNetsAgainstFootprints, type NetlistReport } from '@/lib/pcb/netlist-validation';
import { checkCdcGate } from '@/lib/pcb/cdc-guard';

export const runtime = 'nodejs';
// Deux appels Groq séquentiels (BOM + nets stricts) + une réparation : la
// limite Vercel par défaut est trop basse pour le flux complet.
export const maxDuration = 60;

interface ProposedComponent {
  type: string;
  reference: string;
  value: string;
  libName: string;
  footprintName: string;
  quantity: number;
  xMm: number;
  yMm: number;
  rotation: number;
  rationale: string;
  searchKeyword: string;
  strategy?: FootprintResolution;
  toVerify?: boolean;
}

/** Extrait les nets d'une réponse LLM, en tolérant `REF.PIN` et {ref, pin}. */
function parseNetCandidates(rawNets: unknown): { name: string; pins: string[] }[] {
  const candidates = Array.isArray(rawNets) ? rawNets : [];
  const parsed: { name: string; pins: string[] }[] = [];
  for (const n of candidates) {
    if (!n || typeof n !== 'object') continue;
    const net = n as Record<string, unknown>;
    const name = typeof net.name === 'string' ? net.name.trim() : '';
    const pins = Array.isArray(net.pins)
      ? net.pins
          .map((p) => {
            if (typeof p === 'string') return p.trim();
            if (p && typeof p === 'object') {
              const o = p as Record<string, unknown>;
              const ref = String(o.ref ?? o.reference ?? o.component ?? '').trim();
              const num = String(o.pin ?? o.number ?? o.name ?? '').trim();
              return ref && num ? `${ref}.${num}` : '';
            }
            return '';
          })
          .filter((p) => /^[A-Za-z0-9_]+\.[^\s]+$/.test(p))
      : [];
    if (name && pins.length >= 2) parsed.push({ name, pins });
  }
  return parsed;
}

/** Deuxième passe : le LLM reçoit les VRAIS pads des composants retenus. */
function buildStrictNetsPrompt(
  components: Array<{ reference: string; value: string; libName: string; footprintName: string }>,
  padsByRef: Map<string, string[]>,
  draftNets: Array<{ name: string; pins: string[] }> = [],
): string {
  const list = components
    .map((c) => {
      const pads = padsByRef.get(c.reference) ?? [];
      return `- ${c.reference} (${c.value || c.libName}:${c.footprintName}) — pads: ${
        pads.length ? pads.join(', ') : 'inconnus'
      }`;
    })
    .join('\n');
  const draft = draftNets.length
    ? `\nPROPOSITION INITIALE À CORRIGER (ne la recopie pas aveuglément ; vérifie chaque pin) :\n${draftNets
        .map((n) => `- ${n.name}: ${n.pins.join(', ')}`)
        .join('\n')}\n`
    : '';
  return `Tu es un ingénieur électronique. La liste des composants est déjà figée. Voici leurs VRAIS numéros de pads :
${list}
${draft}
Réponds UNIQUEMENT en JSON valide : {"nets":[{"name":"...","pins":["REF.PIN",...]}]}

RÈGLES STRICTES :
- Produis au moins 2 nets : un nommé "GND" et un dont le nom contient VCC, VDD ou 5V.
- Chaque net contient au moins 2 pins.
- Chaque pin est exactement "REF.PIN", avec REF choisi UNIQUEMENT dans la liste ci-dessus.
- Pour un composant dont les pads sont connus, le PIN doit être l'un de ceux listés.
- Pour un composant dont les pads sont "inconnus", conserve les pins plausibles de la proposition initiale : ils seront marqués à vérifier.
- Relie l'alimentation et la masse de tous les composants actifs (U*, IC*).
- Aucun texte, commentaire ou explication en dehors du JSON.`;
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
  const projectId = typeof b.projectId === 'string' ? b.projectId.trim() : '';
  // Le panneau Sourcing envoie `forceRefresh`, les anciens appels `force` :
  // accepter les deux, sinon le bouton « Régénérer » resservait le cache.
  const forceRefresh = b.forceRefresh === true || b.force === true;
  const peek = b.peek === true;
  if (!projectId) {
    return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  }
  // Le mode peek ne génère rien : il peut lire un état vide sans CDC validé.
  if (!peek) {
    const gate = await checkCdcGate(projectId);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.error, message: gate.message },
        { status: gate.status },
      );
    }
  }

  const project = await prisma.pcbProject.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
  }

  const cdc = project.description?.trim();
  if (!cdc) {
    return NextResponse.json(
      { error: 'Aucun contexte validé (phase pré-implantation manquante)' },
      { status: 400 },
    );
  }

  // Cache : si des propositions existent déjà pour le même CDC et qu'on ne force pas,
  // on les renvoie sans rappeler le LLM (économie de quota).
  const cdcHash = hashKey(cdc);
  const cached = project.sourcingCache as {
    components?: unknown;
    count?: number;
    cdcHash?: string;
    nets?: unknown;
    cacheVersion?: number;
    netlistReport?: unknown;
    rawProposal?: unknown;
  } | null;
  // v3 : la netlist est validée contre les pads réels et le rapport est
  // persisté. Les caches v2 sont ignorés une fois pour forcer une génération
  // complète avec la nouvelle validation.
  const cachedNets = (Array.isArray(cached?.nets) ? cached.nets : []).filter(
    (n): n is { name: string; pins: string[] } =>
      !!n &&
      typeof n === 'object' &&
      typeof (n as { name?: unknown }).name === 'string' &&
      Array.isArray((n as { pins?: unknown }).pins),
  );
  if (
    !forceRefresh &&
    cached?.cacheVersion === 3 &&
    cached.cdcHash === cdcHash &&
    Array.isArray(cached.components) &&
    cached.components.length > 0
  ) {
    console.info('[PCB:SOURCE] Cache hit', { projectId, count: cached.components.length });
    const cachedComponents = cached.components as Array<Record<string, unknown>>;
    const footprintsRoot =
      process.env.PARTIVA_KICAD_FOOTPRINTS_ROOT ??
      'C:/Program Files/KiCad/10.0/share/kicad/footprints';
    const refreshed = [];
    const padsByRef = new Map<string, string[]>();
    const footprintsByRef = new Map<string, string>();
    const fallbackRefs = new Set<string>();
    for (const p of cachedComponents) {
      const reference = String(p.reference ?? '');
      const resolved = resolveKicadFootprint(
        String(p.libName ?? ''),
        String(p.footprintName ?? ''),
        reference,
        footprintsRoot,
      );
      const pads = getFootprintPadNumbers(resolved.libName, resolved.footprintName);
      padsByRef.set(reference, pads);
      footprintsByRef.set(reference, `${resolved.libName}:${resolved.footprintName}`);
      if (resolved.strategy === 'fallback') fallbackRefs.add(reference);
      const comp = {
        ...p,
        libName: resolved.libName,
        footprintName: resolved.footprintName,
        strategy: resolved.strategy,
        toVerify: resolved.strategy === 'fallback' || pads.length === 0,
        xMm: p.xMm,
        yMm: p.yMm,
      };
      const kw = String(p.searchKeyword || p.type || '');
      const candidates = await prisma.componentCatalog.findMany({
        where: {
          OR: [
            { name: { contains: kw, mode: 'insensitive' } },
            { category: { contains: kw, mode: 'insensitive' } },
            { footprint: { contains: String(p.footprintName ?? ''), mode: 'insensitive' } },
            { supplierRef: { contains: kw, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          category: true,
          footprint: true,
          symbol: true,
          supplier: true,
          supplierRef: true,
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      });
      refreshed.push({
        ...comp,
        candidates: candidates.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          footprint: c.footprint,
          symbol: c.symbol,
          supplier: c.supplier,
          supplierRef: c.supplierRef,
        })),
      });
    }

    // Rejouer la validation déterministe : un cache v3 peut avoir été écrit
    // avant une mise à jour des empreintes, ou après une édition manuelle.
    const validated = validateNetsAgainstFootprints(cachedNets, padsByRef, {
      footprintsByRef,
      fallbackRefs,
    });
    const cachedReport = (cached.netlistReport ?? null) as NetlistReport | null;
    let report: NetlistReport =
      cachedNets.length > 0
        ? { ...validated.report, stale: cachedReport?.stale === true }
        : (cachedReport ?? validated.report);
    if (report.invalidPins.length > 0) {
      report = { ...report, code: 'INVALID_PINS' };
    }

    // Persister le rapport rafraîchi (aucun appel LLM) pour F3/F4.
    try {
      await prisma.pcbProject.update({
        where: { id: projectId },
        data: {
          sourcingCache: {
            components: refreshed,
            count: refreshed.length,
            nets: validated.nets,
            cdcHash,
            cacheVersion: 3,
            netlistReport: report,
            rawProposal: cached.rawProposal ?? null,
          } as object,
        },
      });
    } catch (e) {
      console.warn('[PCB:SOURCE] Cache refresh save failed', e);
    }

    // La netlist est la source des ratsnest : si elle existe dans le cache mais
    // a disparu de la BDD (reset, nettoyage), la restaurer sans appel LLM.
    if (validated.nets.length > 0) {
      try {
        const existing = await prisma.pcbNet.count({ where: { projectId } });
        if (existing === 0) {
          await prisma.pcbNet.createMany({
            data: validated.nets.map((n) => ({
              projectId,
              name: n.name,
              pins: n.pins as object,
              status: 'proposed',
            })),
          });
          console.info('[PCB:SOURCE] Nets restaurés depuis le cache', {
            projectId,
            count: validated.nets.length,
          });
        }
      } catch (e) {
        console.warn('[PCB:SOURCE] Restauration nets échouée', e);
      }
    }

    return NextResponse.json({
      components: refreshed,
      count: refreshed.length,
      nets: validated.nets,
      netsMissing: validated.nets.length === 0,
      cached: true,
      netlistReport: report,
      rawProposal: cached.rawProposal ?? null,
    });
  }

  // Mode "peek" : ne jamais déclencher le LLM, renvoyer un état vide si pas de cache.
  if (peek) {
    return NextResponse.json({
      components: [],
      count: 0,
      nets: [],
      netsMissing: true,
      cached: false,
      empty: true,
    });
  }

  const apiKey = process.env.GROQ_API_KEY?.trim() || undefined;
  if (!hasLlmProvider()) {
    return NextResponse.json({ error: 'Aucun fournisseur LLM configuré' }, { status: 503 });
  }

  const prompt = `Tu es un ingénieur électronique senior. À partir du cahier des charges validé d'une carte électronique, propose la liste des composants à implanter sur le PCB.

CAHIER DES CHARGES VALIDÉ :
${cdc}

Réponds UNIQUEMENT en JSON valide, sans markdown, avec la structure :
{
  "components": [
    {
      "type": "type de composant (ex. Régulateur 5V, Capteur température)",
      "reference": "référence unique (ex. U1, R1, C1)",
      "value": "valeur (ex. 5V, 10kΩ, 100nF)",
      "libName": "nom de la bibliothèque KiCad (ex. Regulator_Linear, Device, Sensor)",
      "footprintName": "nom de l'empreinte KiCad (ex. TO-220-3_Vertical, R_0603_1608Metric)",
      "quantity": 1,
      "xMm": 50.0,
      "yMm": 50.0,
      "rotation": 0,
      "rationale": "justification courte",
      "searchKeyword": "mot-clé pour chercher dans le catalogue (ex. LM7805, resistor 10k)"
    }
  ],
  "nets": [
    { "name": "VCC_5V", "pins": ["U1.1", "C1.1", "R1.1"] },
    { "name": "GND", "pins": ["U1.2", "C1.2", "J1.2"] }
  ]
}

Règles :
- Propose tous les composants nécessaires pour réaliser la carte (régulateur, microcontrôleur, capteurs, connecteurs, passifs, etc.).
- RÈGLE STRICTE : le tableau "nets" est OBLIGATOIRE et doit contenir au moins 2 réseaux (par exemple VCC et GND), chacun avec au moins 2 pins au format "REF.numéro" (ex. "U1.1", "C1.2"). Sans nets valides, le placement déterministe et le ratsnest sont impossibles.
- Les coordonnées xMm/yMm sont secondaires : mets 0 ou des valeurs approximatives. Le placement final est calculé automatiquement par un algorithme déterministe à partir des nets. Si tu les fournis, garde-les dans un plateau 80×60 mm (x 5-75, y 5-55).
- libName DOIT être l'un des noms de bibliothèques KiCad 10 suivants (utilise UNIQUEMENT ces noms, pas d'invention) :
  Audio_Module, Battery, Button_Switch_Keyboard, Button_Switch_SMD, Button_Switch_THT, Buzzer_Beeper, Calibration_Scale, Capacitor_SMD, Capacitor_Tantalum_SMD, Capacitor_THT, Connector, Connector_AMASS, Connector_Amphenol, Connector_Audio, Connector_BarrelJack, Connector_Card, Connector_Coaxial, Connector_DIN, Connector_Dsub, Connector_FFC-FPC, Connector_Harting, Connector_Harwin, Connector_Hirose, Connector_IDC, Connector_JAE, Connector_JST, Connector_Molex, Connector_Pin, Connector_PinHeader_2.54mm, Connector_PinSocket_2.54mm, Connector_RJ, Connector_Samtec, Connector_SATA_SAS, Connector_TE-Connectivity, Connector_USB, Connector_Video, Connector_Wago, Connector_Wire, Connector_Wuerth, Converter_ACDC, Converter_DCDC, Crystal, Diode_SMD, Diode_THT, Display, Display_7Segment, Ferrite_THT, Fiducial, Filter, Fuse, Heatsink, Inductor_SMD, Inductor_SMD_Wurth, Inductor_THT, Inductor_THT_Wurth, Jumper, LED_SMD, LED_THT, Module, Motors, MountingHole, NetTie, OptoDevice, Oscillator, Package_BGA, Package_CSP, Package_DFN_QFN, Package_DIP, Package_LCC, Package_LGA, Package_QFP, Package_SIP, Package_SO, Package_SO_J-Lead, Package_SON, Package_TO_SOT_SMD, Package_TO_SOT_THT, Panelization, Potentiometer_SMD, Potentiometer_THT, Relay_SMD, Relay_THT, Resistor_SMD, Resistor_THT, RF, RF_Antenna, RF_Converter, RF_GPS, RF_GSM, RF_Mini-Circuits, RF_Module, RF_Shielding, RF_WiFi, Rotary_Encoder, Sensor, Sensor_Audio, Sensor_Current, Sensor_Distance, Sensor_Humidity, Sensor_Motion, Sensor_Pressure, Sensor_Voltage, Socket, TerminalBlock, TerminalBlock_Phoenix, TerminalBlock_WAGO, TerminalBlock_Wuerth, TestPoint, Transformer_SMD, Transformer_THT, Transistor_Power, Transistor_Power_Module, Valve, Varistor.
- footprintName doit être une empreinte existante dans la bibliothèque choisie (ex. TO-220-3_Vertical, R_0603_1608Metric, C_0805_2012Metric).
- searchKeyword : un ou deux mots pour chercher des composants similaires dans un catalogue.
- Ne jamais inventer de composant inutile. Sois exhaustif mais raisonnable (max 15 composants).`;

  const guard = acquireLlmGuard(`pcb:source:${projectId}`);
  if (!guard.ok) {
    return NextResponse.json({ error: 'Sourcing déjà en cours' }, { status: 429 });
  }

  try {
    let proposed: ProposedComponent[] = [];
    let proposedNets: { name: string; pins: string[] }[] = [];
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 1; attempt++) {
      try {
        const llmRes = await callGroq([{ role: 'user', content: prompt }], apiKey, {
          model: process.env.GROQ_MODEL,
          temperature: 0.2,
          maxTokens: 2560,
          timeout: 45000,
          responseFormat: 'json_object',
        });

        let parsed: unknown;
        try {
          parsed = JSON.parse(llmRes.content);
        } catch {
          lastError = new Error('Réponse LLM non-JSON');
          continue;
        }

        const obj = (parsed ?? {}) as Record<string, unknown>;
        const raw = Array.isArray(obj.components) ? obj.components : [];
        const next: ProposedComponent[] = [];
        for (const c of raw) {
          if (!c || typeof c !== 'object') continue;
          const item = c as Record<string, unknown>;
          const type = typeof item.type === 'string' ? item.type.trim() : '';
          const reference = typeof item.reference === 'string' ? item.reference.trim() : '';
          const value = typeof item.value === 'string' ? item.value.trim() : '';
          const libName =
            typeof item.libName === 'string' ? item.libName.trim().replace(/\.pretty$/i, '') : '';
          const footprintName =
            typeof item.footprintName === 'string' ? item.footprintName.trim() : '';
          if (!type || !reference || !libName || !footprintName) continue;

          const quantity =
            typeof item.quantity === 'number' && Number.isFinite(item.quantity)
              ? Math.max(1, Math.round(item.quantity))
              : 1;
          const xMm = typeof item.xMm === 'number' && Number.isFinite(item.xMm) ? item.xMm : 10;
          const yMm = typeof item.yMm === 'number' && Number.isFinite(item.yMm) ? item.yMm : 10;
          const rotation =
            typeof item.rotation === 'number' && Number.isFinite(item.rotation) ? item.rotation : 0;
          const rationale = typeof item.rationale === 'string' ? item.rationale.trim() : '';
          const searchKeyword =
            typeof item.searchKeyword === 'string' ? item.searchKeyword.trim() : type;

          next.push({
            type,
            reference,
            value,
            libName,
            footprintName,
            quantity,
            xMm,
            yMm,
            rotation,
            rationale,
            searchKeyword,
          });
        }

        if (next.length > 0) {
          proposed = next;
          // Parse nets if provided (`REF.PIN` ou `{ref, pin}`).
          const parsedNets = parseNetCandidates(obj.nets ?? obj.netlist);
          // Optimize placement using nets
          if (parsedNets.length > 0) {
            try {
              const { optimizePlacement, inferPlacementRole, buildHints } =
                await import('@/lib/pcb/placement');
              const boardW = 80;
              const boardH = 60;
              const placed = optimizePlacement(
                proposed.map((c) => {
                  const size = getFootprintSize(c.libName, c.footprintName);
                  const hints = buildHints({
                    reference: c.reference,
                    value: c.value,
                    type: c.type,
                    footprint: `${c.libName}:${c.footprintName}`,
                    rationale: c.rationale,
                  });
                  return {
                    reference: c.reference,
                    xMm: c.xMm,
                    yMm: c.yMm,
                    rotation: c.rotation,
                    role: inferPlacementRole({
                      reference: c.reference,
                      value: c.value,
                      type: c.type,
                      footprint: `${c.libName}:${c.footprintName}`,
                      rationale: c.rationale,
                    }),
                    hints,
                    ...(size ? { widthMm: size.widthMm, heightMm: size.heightMm } : {}),
                  };
                }),
                parsedNets,
                { widthMm: boardW, heightMm: boardH, originX: 5, originY: 5 },
              );
              // Write back optimized positions
              for (const c of proposed) {
                const opt = placed.find((p) => p.reference === c.reference);
                if (opt) {
                  c.xMm = opt.xMm;
                  c.yMm = opt.yMm;
                  c.rotation = opt.rotation;
                }
              }
              // Store nets on the result (will be returned)
              // Save nets for return
              proposedNets = parsedNets;
            } catch (e) {
              console.warn('[PCB:SOURCE] Placement optimization failed', e);
              proposedNets = parsedNets;
            }
          } else {
            proposedNets = parsedNets;
          }
          break;
        }
        lastError = new Error('Aucun composant valide dans la réponse');
      } catch (e) {
        console.error('[PCB:SOURCE] Erreur LLM', e);
        lastError = e;
      }
    }

    if (proposed.length === 0) {
      const message =
        lastError instanceof Error
          ? lastError.message
          : typeof lastError === 'object' && lastError && 'message' in lastError
            ? String((lastError as { message: unknown }).message)
            : 'Erreur LLM';
      return NextResponse.json({ error: message }, { status: 502 });
    }

    // Offset des coordonnées par rapport au plateau réel (si fichier KiCad disponible)
    let offsetX = 0;
    let offsetY = 0;
    const sourceBoardPath = process.env.PARTIVA_KICAD_BOARD?.trim() || project.kicadFilePath;
    if (sourceBoardPath) {
      try {
        const { parseKicadPcb } = await import('@/lib/pcb/kicad-file-reader');
        const fs = await import('node:fs');
        const path = await import('node:path');
        const abs = path.isAbsolute(normalizeBoardPath(sourceBoardPath))
          ? normalizeBoardPath(sourceBoardPath)
          : path.join(process.cwd(), normalizeBoardPath(sourceBoardPath));
        if (fs.existsSync(abs)) {
          const parsed = parseKicadPcb(fs.readFileSync(abs, 'utf8'));
          console.info('[PCB:SOURCE] board origin', {
            kicadFilePath: sourceBoardPath,
            origin: parsed.origin,
            dimensions: parsed.dimensions,
          });
          if (parsed.origin && (parsed.origin.x > 0 || parsed.origin.y > 0)) {
            offsetX = parsed.origin.x;
            offsetY = parsed.origin.y;
          }
        }
      } catch (e) {
        console.warn('[PCB:SOURCE] offset calcul impossible', e);
      }
    }

    // Résolution des empreintes KiCad : exact → autre lib → fuzzy → fallback par référence.
    const footprintsRoot =
      process.env.PARTIVA_KICAD_FOOTPRINTS_ROOT ??
      'C:/Program Files/KiCad/10.0/share/kicad/footprints';

    // Search BDD for similar components (up to 10 per proposed component)
    const components = [];
    for (const p of proposed) {
      const resolved = resolveKicadFootprint(
        p.libName,
        p.footprintName,
        p.reference,
        footprintsRoot,
      );
      if (resolved.corrected) {
        console.warn('[PCB:SOURCE] Empreinte IA introuvable, fallback appliqué', {
          reference: p.reference,
          proposed: resolved.proposed,
          fallback: `${resolved.libName}:${resolved.footprintName}`,
        });
      }
      const comp = {
        ...p,
        libName: resolved.libName,
        footprintName: resolved.footprintName,
        strategy: resolved.strategy,
        toVerify: resolved.strategy === 'fallback',
        xMm: Math.round((p.xMm + offsetX) * 100) / 100,
        yMm: Math.round((p.yMm + offsetY) * 100) / 100,
      };
      const kw = p.searchKeyword || p.type;
      const candidates = await prisma.componentCatalog.findMany({
        where: {
          OR: [
            { name: { contains: kw, mode: 'insensitive' } },
            { category: { contains: kw, mode: 'insensitive' } },
            { footprint: { contains: p.footprintName, mode: 'insensitive' } },
            { supplierRef: { contains: kw, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          category: true,
          footprint: true,
          symbol: true,
          supplier: true,
          supplierRef: true,
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      });

      components.push({
        ...comp,
        candidates: candidates.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          footprint: c.footprint,
          symbol: c.symbol,
          supplier: c.supplier,
          supplierRef: c.supplierRef,
        })),
      });
    }

    // Validation croisée LLM ↔ pads réels. Le cache ne doit jamais persister
    // des REF.PIN inexistants sur l'empreinte choisie.
    const padsByRef = new Map<string, string[]>();
    const footprintsByRef = new Map<string, string>();
    const fallbackRefs = new Set<string>();
    for (const comp of components) {
      const pads = getFootprintPadNumbers(comp.libName, comp.footprintName);
      padsByRef.set(comp.reference, pads);
      footprintsByRef.set(comp.reference, `${comp.libName}:${comp.footprintName}`);
      if (comp.strategy === 'fallback') fallbackRefs.add(comp.reference);
      if (pads.length === 0) comp.toVerify = true;
    }

    // Phase 2 : toujours demander une netlist stricte avec les pads réels. Le
    // brouillon de la phase 1 sert d'indice, jamais de vérité.
    let rawProposal: Array<{ name: string; pins: string[] }> = proposedNets;
    let validation = validateNetsAgainstFootprints(proposedNets, padsByRef, {
      footprintsByRef,
      fallbackRefs,
    });
    let finalNets = validation.nets;
    let report = validation.report;

    try {
      const strictRes = await callGroq(
        [
          {
            role: 'user',
            content: buildStrictNetsPrompt(components, padsByRef, proposedNets),
          },
        ],
        apiKey,
        {
          model: process.env.GROQ_MODEL,
          temperature: 0,
          maxTokens: 2048,
          timeout: 30000,
          responseFormat: 'json_object',
        },
      );
      const strictObj = JSON.parse(strictRes.content) as Record<string, unknown>;
      const strictNets = parseNetCandidates(strictObj.nets ?? strictObj.netlist);
      if (strictNets.length > 0) {
        rawProposal = strictNets;
        validation = validateNetsAgainstFootprints(strictNets, padsByRef, {
          footprintsByRef,
          fallbackRefs,
        });
        finalNets = validation.nets;
        report = validation.report;
      }
    } catch (e) {
      console.warn('[PCB:SOURCE] Phase 2 netlist impossible', e);
    }

    if (finalNets.length === 0) {
      // Une seule tentative de réparation supplémentaire avec la source de
      // vérité. Maximum 3 appels LLM au total (BOM + 2 tentatives nets).
      try {
        const retryRes = await callGroq(
          [
            {
              role: 'user',
              content: buildStrictNetsPrompt(
                components,
                padsByRef,
                rawProposal.length ? rawProposal : proposedNets,
              ),
            },
          ],
          apiKey,
          {
            model: process.env.GROQ_MODEL,
            temperature: 0,
            maxTokens: 2048,
            timeout: 30000,
            responseFormat: 'json_object',
          },
        );
        const retryObj = JSON.parse(retryRes.content) as Record<string, unknown>;
        const retryNets = parseNetCandidates(retryObj.nets ?? retryObj.netlist);
        if (retryNets.length > 0) {
          rawProposal = retryNets;
          validation = validateNetsAgainstFootprints(retryNets, padsByRef, {
            footprintsByRef,
            fallbackRefs,
          });
          finalNets = validation.nets;
          report = validation.report;
        }
        if (finalNets.length > 0) {
          console.info('[PCB:SOURCE] Netlist réparée au second essai', {
            count: finalNets.length,
          });
        }
      } catch (e) {
        console.warn('[PCB:SOURCE] Second essai netlist impossible', e);
      }
    }

    if (finalNets.length === 0) {
      const emptyReport: NetlistReport = { ...report, repaired: true, code: 'INVALID_PINS' };
      try {
        await prisma.pcbProject.update({
          where: { id: projectId },
          data: {
            sourcingCache: {
              components,
              count: components.length,
              nets: [],
              cdcHash,
              cacheVersion: 3,
              netlistReport: emptyReport,
              rawProposal,
            } as object,
          },
        });
      } catch (e) {
        console.warn('[PCB:SOURCE] Cache save (netlist vide) échoué', e);
      }
      return NextResponse.json(
        {
          error: LLM_NETLIST_EMPTY_CODE,
          message: NET_EMPTY_MESSAGE,
          components,
          nets: [],
          netsMissing: true,
          netlistReport: emptyReport,
          rawProposal,
        },
        { status: 422 },
      );
    }

    if (report.invalidPins.length > 0) {
      report = { ...report, code: 'INVALID_PINS' };
    }

    const warnings: string[] = [];
    const droppedPins = report.droppedPins.length;
    if (droppedPins > 0) {
      warnings.push(`${droppedPins} broche(s) inexistante(s) sur les empreintes ont été retirées.`);
    }
    for (const unreadable of report.unreadableFootprints) {
      warnings.push(
        `${unreadable.ref} : empreinte illisible (${unreadable.footprint || 'inconnue'}), broches à vérifier.`,
      );
    }
    for (const ref of fallbackRefs) {
      warnings.push(`${ref} : empreinte remplacée par un fallback, à vérifier.`);
    }
    for (const [ref, pads] of padsByRef) {
      if (pads.length === 0) continue;
      const connected = new Set(
        finalNets.flatMap((n) => n.pins.filter((p) => p.startsWith(`${ref}.`))),
      );
      const hasPower = [...connected].some(
        (p) =>
          /vcc|vdd|3v3|5v/i.test(p) ||
          finalNets.some((n) => /vcc|vdd|3v3|5v/i.test(n.name) && n.pins.includes(p)),
      );
      const hasGnd = [...connected].some((p) =>
        finalNets.some((n) => /gnd|vss|ground/i.test(n.name) && n.pins.includes(p)),
      );
      if (!hasPower || !hasGnd) {
        warnings.push(`${ref} : alimentation ou GND manquant dans la netlist.`);
      }
    }
    proposedNets = finalNets;

    // Persistance des nets (netlist LLM) — upsert par nom.
    try {
      await prisma.pcbNet.deleteMany({ where: { projectId, status: 'proposed' } });
      if (proposedNets.length > 0) {
        await prisma.pcbNet.createMany({
          data: proposedNets.map((n) => ({
            projectId,
            name: n.name,
            pins: n.pins as object,
            status: 'proposed',
          })),
        });
      }
    } catch (e) {
      console.warn('[PCB:SOURCE] Nets save failed', e);
    }

    // Persistance du cache pour éviter de re-solliciter le LLM.
    try {
      await prisma.pcbProject.update({
        where: { id: projectId },
        data: {
          sourcingCache: {
            components,
            count: components.length,
            nets: proposedNets,
            cdcHash,
            cacheVersion: 3,
            netlistReport: report,
            rawProposal,
          } as object,
        },
      });
    } catch (e) {
      console.warn('[PCB:SOURCE] Cache save failed', e);
    }

    console.info('[PCB:SOURCE] Proposition', {
      projectId,
      count: components.length,
      nets: proposedNets.length,
    });
    return NextResponse.json({
      components,
      count: components.length,
      nets: proposedNets,
      netsMissing: proposedNets.length === 0,
      droppedPins,
      warnings,
      netlistReport: report,
      rawProposal,
    });
  } finally {
    guard.release();
  }
}
