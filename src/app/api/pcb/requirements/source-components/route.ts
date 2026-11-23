import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callGroq } from '@/lib/ai/groq-client';
import { requireAdmin } from '@/lib/auth-admin';
import { resolveKicadFootprint } from '@/lib/pcb/kicad-footprints';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';

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
  const forceRefresh = b.force === true;
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

  // Cache : si des propositions existent déjà et qu'on ne force pas, on les renvoie
  // sans rappeler le LLM (économie de quota).
  const cached = project.sourcingCache as { components?: unknown; count?: number } | null;
  if (!forceRefresh && cached && Array.isArray(cached.components) && cached.components.length > 0) {
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
    return NextResponse.json({ components: refreshed, count: refreshed.length, cached: true });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY non configurée' }, { status: 503 });
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
  ]
}

Règles :
- Propose tous les composants nécessaires pour réaliser la carte (régulateur, microcontrôleur, capteurs, connecteurs, passifs, etc.).
- Les coordonnées xMm/yMm doivent être à l'intérieur d'un plateau de 80×60 mm (x entre 5 et 75, y entre 5 et 55), espacées d'au moins 10 mm.
- libName DOIT être l'un des noms de bibliothèques KiCad 10 suivants (utilise UNIQUEMENT ces noms, pas d'invention) :
  Audio_Module, Battery, Button_Switch_Keyboard, Button_Switch_SMD, Button_Switch_THT, Buzzer_Beeper, Calibration_Scale, Capacitor_SMD, Capacitor_Tantalum_SMD, Capacitor_THT, Connector, Connector_AMASS, Connector_Amphenol, Connector_Audio, Connector_BarrelJack, Connector_Card, Connector_Coaxial, Connector_DIN, Connector_Dsub, Connector_FFC-FPC, Connector_Harting, Connector_Harwin, Connector_Hirose, Connector_IDC, Connector_JAE, Connector_JST, Connector_Molex, Connector_Pin, Connector_PinHeader_2.54mm, Connector_PinSocket_2.54mm, Connector_RJ, Connector_Samtec, Connector_SATA_SAS, Connector_TE-Connectivity, Connector_USB, Connector_Video, Connector_Wago, Connector_Wire, Connector_Wuerth, Converter_ACDC, Converter_DCDC, Crystal, Diode_SMD, Diode_THT, Display, Display_7Segment, Ferrite_THT, Fiducial, Filter, Fuse, Heatsink, Inductor_SMD, Inductor_SMD_Wurth, Inductor_THT, Inductor_THT_Wurth, Jumper, LED_SMD, LED_THT, Module, Motors, MountingHole, NetTie, OptoDevice, Oscillator, Package_BGA, Package_CSP, Package_DFN_QFN, Package_DIP, Package_LCC, Package_LGA, Package_QFP, Package_SIP, Package_SO, Package_SO_J-Lead, Package_SON, Package_TO_SOT_SMD, Package_TO_SOT_THT, Panelization, Potentiometer_SMD, Potentiometer_THT, Relay_SMD, Relay_THT, Resistor_SMD, Resistor_THT, RF, RF_Antenna, RF_Converter, RF_GPS, RF_GSM, RF_Mini-Circuits, RF_Module, RF_Shielding, RF_WiFi, Rotary_Encoder, Sensor, Sensor_Audio, Sensor_Current, Sensor_Distance, Sensor_Humidity, Sensor_Motion, Sensor_Pressure, Sensor_Voltage, Socket, TerminalBlock, TerminalBlock_Phoenix, TerminalBlock_WAGO, TerminalBlock_Wuerth, TestPoint, Transformer_SMD, Transformer_THT, Transistor_Power, Transistor_Power_Module, Valve, Varistor.
- footprintName doit être une empreinte existante dans la bibliothèque choisie (ex. TO-220-3_Vertical, R_0603_1608Metric, C_0805_2012Metric).
- searchKeyword : un ou deux mots pour chercher des composants similaires dans un catalogue.
- Ne jamais inventer de composant inutile. Sois exhaustif mais raisonnable (max 15 composants).`;

  let proposed: ProposedComponent[] = [];
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const llmRes = await callGroq([{ role: 'user', content: prompt }], apiKey, {
        model: process.env.GROQ_MODEL,
        temperature: 0.2,
        maxTokens: 4096,
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
    const resolved = resolveKicadFootprint(p.libName, p.footprintName, p.reference, footprintsRoot);
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

  // Persistance du cache pour éviter de re-solliciter le LLM.
  try {
    await prisma.pcbProject.update({
      where: { id: projectId },
      data: { sourcingCache: { components, count: components.length } as object },
    });
  } catch (e) {
    console.warn('[PCB:SOURCE] Cache save failed', e);
  }

  console.info('[PCB:SOURCE] Proposition', { projectId, count: components.length });
  return NextResponse.json({ components, count: components.length });
}
