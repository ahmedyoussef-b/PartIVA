import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callGroq, hasLlmProvider } from '@/lib/ai/groq-client';
import { requireAdmin } from '@/lib/auth-admin';
import {
  getFootprintPadNumbers,
  getFootprintSize,
  resolveKicadFootprint,
} from '@/lib/pcb/kicad-footprints';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';
import { acquireLlmGuard, hashKey } from '@/lib/utils/llm-guard';

export const runtime = 'nodejs';

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
  } | null;
  // v2 : la netlist fait partie intégrante du cache. Les anciennes entrées
  // (sans nets) sont ignorées une fois pour forcer une génération complète.
  const cachedNets = (Array.isArray(cached?.nets) ? cached.nets : []).filter(
    (n): n is { name: string; pins: string[] } =>
      !!n &&
      typeof n === 'object' &&
      typeof (n as { name?: unknown }).name === 'string' &&
      Array.isArray((n as { pins?: unknown }).pins),
  );
  if (
    !forceRefresh &&
    cached?.cacheVersion === 2 &&
    cached.cdcHash === cdcHash &&
    Array.isArray(cached.components) &&
    cached.components.length > 0
  ) {
    console.info('[PCB:SOURCE] Cache hit', { projectId, count: cached.components.length });
    // Recompute candidates from catalog (cheap, no LLM) to keep prices fresh.
    const cachedComponents = cached.components as Array<Record<string, unknown>>;
    // Re-run the cheap footprint-resolution + catalog search for each cached component.
    const footprintsRoot =
      process.env.PARTIVA_KICAD_FOOTPRINTS_ROOT ??
      'C:/Program Files/KiCad/10.0/share/kicad/footprints';
    const refreshed = [];
    for (const p of cachedComponents) {
      const resolved = resolveKicadFootprint(
        String(p.libName ?? ''),
        String(p.footprintName ?? ''),
        String(p.reference ?? ''),
        footprintsRoot,
      );
      const comp = {
        ...p,
        libName: resolved.libName,
        footprintName: resolved.footprintName,
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
    // La netlist est la source des ratsnest : si elle existe dans le cache mais
    // a disparu de la BDD (reset, nettoyage), la restaurer sans appel LLM.
    if (cachedNets.length > 0) {
      try {
        const existing = await prisma.pcbNet.count({ where: { projectId } });
        if (existing === 0) {
          await prisma.pcbNet.createMany({
            data: cachedNets
              .filter((n) => n.pins.length >= 2)
              .map((n) => ({
                projectId,
                name: n.name,
                pins: n.pins as object,
                status: 'proposed',
              })),
          });
          console.info('[PCB:SOURCE] Nets restaurés depuis le cache', {
            projectId,
            count: cachedNets.length,
          });
        }
      } catch (e) {
        console.warn('[PCB:SOURCE] Restauration nets échouée', e);
      }
    }

    return NextResponse.json({
      components: refreshed,
      count: refreshed.length,
      nets: cachedNets,
      netsMissing: cachedNets.length === 0,
      cached: true,
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
          // Parse nets if provided
          const rawNets = Array.isArray(obj.nets)
            ? obj.nets
            : Array.isArray(obj.netlist)
              ? obj.netlist
              : [];
          const parsedNets: { name: string; pins: string[] }[] = [];
          for (const n of rawNets) {
            if (!n || typeof n !== 'object') continue;
            const net = n as Record<string, unknown>;
            const name = typeof net.name === 'string' ? net.name.trim() : '';
            // Tolérer `"U1.1"` mais aussi `{ref:"U1", pin:"1"}`.
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
            if (name && pins.length >= 2) parsedNets.push({ name, pins });
          }
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

    // Validation croisée LLM ↔ pads réels (identique à nets-only) : le cache
    // ne doit jamais persister des REF.PIN inexistants sur l'empreinte choisie.
    const warnings: string[] = [];
    const padsByRef = new Map<string, string[]>();
    for (const comp of components) {
      padsByRef.set(comp.reference, getFootprintPadNumbers(comp.libName, comp.footprintName));
    }
    const validPins = new Set<string>();
    for (const [ref, pads] of padsByRef) {
      for (const pad of pads) validPins.add(`${ref}.${pad}`);
    }
    const filteredNets: typeof proposedNets = [];
    for (const net of proposedNets) {
      const pins = net.pins.filter((pin) => {
        const ref = pin.split('.')[0] ?? '';
        const readable = (padsByRef.get(ref) ?? []).length > 0;
        return !readable || validPins.has(pin);
      });
      if (pins.length >= 2) filteredNets.push({ name: net.name, pins });
    }
    const droppedPins =
      proposedNets.reduce((acc, n) => acc + n.pins.length, 0) -
      filteredNets.reduce((acc, n) => acc + n.pins.length, 0);
    if (droppedPins > 0) {
      warnings.push(`${droppedPins} broche(s) inexistante(s) sur les empreintes ont été retirées.`);
    }
    for (const [ref, pads] of padsByRef) {
      if (pads.length === 0) continue;
      const connected = new Set(
        filteredNets.flatMap((n) => n.pins.filter((p) => p.startsWith(`${ref}.`))),
      );
      const hasPower = [...connected].some(
        (p) =>
          /vcc|vdd|3v3|5v/i.test(p) ||
          filteredNets.some((n) => /vcc|vdd|3v3|5v/i.test(n.name) && n.pins.includes(p)),
      );
      const hasGnd = [...connected].some((p) =>
        filteredNets.some((n) => /gnd|vss|ground/i.test(n.name) && n.pins.includes(p)),
      );
      if (!hasPower || !hasGnd) {
        warnings.push(`${ref} : alimentation ou GND manquant dans la netlist.`);
      }
    }
    proposedNets = filteredNets;

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
            cacheVersion: 2,
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
    });
  } finally {
    guard.release();
  }
}
