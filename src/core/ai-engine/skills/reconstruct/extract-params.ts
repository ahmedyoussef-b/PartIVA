import { cadParamsSchema, type CadParams } from './types';
import { callGroq, getGroqApiKey } from '../../../../lib/ai/groq-client';
import type { IngestResult } from '../ingest/types';

const DEFAULT_DIAMETER = 10;
const DEFAULT_HEIGHT = 20;

const DEFAULT_PARAMS: CadParams = {
  type: 'cylinder',
  unit: 'mm',
  diameter: DEFAULT_DIAMETER,
  height: DEFAULT_HEIGHT,
};

function stripCodeFence(json: string): string {
  return json.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

function parseJsonReply(content: string): unknown {
  return JSON.parse(stripCodeFence(content));
}

function buildPrompt(ingestResult: IngestResult): string {
  const lines: string[] = [];
  lines.push("Vous êtes un assistant spécialisé en CAO. À partir des informations d'une pièce, extrayez les paramètres CAO demandés.");
  lines.push('Répondez UNIQUEMENT avec un JSON valide, sans texte ni commentaire avant ou après.');
  lines.push('');
  lines.push('## Informations de la pièce');
  lines.push(`- type d'entrée: ${ingestResult.inputType}`);
  lines.push(`- caractéristiques extraites: ${ingestResult.extractedFeatures.join(', ') || 'aucune'}`);
  const dimensions = ingestResult.metadata.dimensions;
  if (dimensions) {
    lines.push(`- dimensions: longueur ${dimensions.length ?? 'non précisée'} mm, largeur ${dimensions.width ?? 'non précisée'} mm, hauteur ${dimensions.height ?? 'non précisée'} mm, diamètre ${dimensions.diameter ?? 'non précisée'} mm, unité ${dimensions.unit ?? 'mm'}`);
  } else {
    lines.push('- dimensions: non précisées');
  }
  lines.push('');
  lines.push('## Règles');
  lines.push("- Le champ `type` est OBLIGATOIRE et doit être l'un de : cylinder, plate, disc, block, sphere.");
  lines.push('- Les champs `length`, `width`, `height`, `diameter` sont OPTIONNELS et doivent être positifs en millimètres (ou cm si unité=cm).');
  lines.push('- `material` est optionnel.');
  lines.push('- `unit` est optionnel, par défaut mm.');
  lines.push('');
  lines.push('## Schéma de réponse');
  lines.push('{ "type": "cylinder" | "plate" | "disc" | "block" | "sphere", "length"?: number, "width"?: number, "height"?: number, "diameter"?: number, "material"?: string, "unit"?: "mm" | "cm" }');
  lines.push('');
  lines.push('## Réponse (JSON uniquement) :');
  return lines.join('\n');
}

export async function extractCadParams(ingestResult: IngestResult): Promise<CadParams> {
  try {
    const { content } = await callGroq(
      [{ role: 'user', content: buildPrompt(ingestResult) }],
      getGroqApiKey() ?? '',
      { maxTokens: 512, temperature: 0 },
    );
    const parsed = cadParamsSchema.safeParse(parseJsonReply(content));
    if (parsed.success) {
      const { type, unit, material, length, width, height, diameter } = parsed.data;
      const params: CadParams = { type };
      if (unit) params.unit = unit;
      if (material) params.material = material;
      if (length !== undefined) params.length = length;
      if (width !== undefined) params.width = width;
      if (height !== undefined) params.height = height;
      if (diameter !== undefined) params.diameter = diameter;
      return params;
    }
  } catch {
    // Groq indisponible ou réponse invalide → fallback par défaut.
  }
  return { ...DEFAULT_PARAMS };
}
