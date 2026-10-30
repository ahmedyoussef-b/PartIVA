import type { IngestResult } from '@/core/ai-engine/skills/ingest/types';

export type MaterialRecommendation = {
  name: string;
  reason: string;
  confidence: number;
};

export function recommendMaterial(
  ingest: IngestResult | null | undefined,
): MaterialRecommendation[] {
  if (!ingest) return [];
  const type = (ingest.metadata?.detectedType ?? '').toLowerCase();
  const dims = ingest.metadata?.dimensions;
  const maxDim = dims
    ? Math.max(dims.length ?? 0, dims.width ?? 0, dims.height ?? 0, dims.diameter ?? 0)
    : 0;
  const recs: MaterialRecommendation[] = [];
  if (type.includes('vis') || type.includes('engrenage')) {
    recs.push({
      name: 'PETG',
      reason: 'Résistance mécanique pour pièces fonctionnelles.',
      confidence: 0.9,
    });
    recs.push({
      name: 'Nylon',
      reason: "Haute résistance à l'usure et à la fatigue.",
      confidence: 0.8,
    });
  } else if (type.includes('roulement')) {
    recs.push({ name: 'Nylon', reason: "Résistance à l'usure pour roulements.", confidence: 0.9 });
    recs.push({ name: 'PETG', reason: 'Bon compromis rigidité/durabilité.', confidence: 0.7 });
  } else if (type.includes('joint') || type.includes('flexible')) {
    recs.push({
      name: 'TPU',
      reason: 'Flexibilité pour joints et pièces souples.',
      confidence: 0.95,
    });
  } else if (maxDim > 0 && maxDim < 50) {
    recs.push({ name: 'PLA', reason: 'Précision pour petites pièces.', confidence: 0.8 });
  } else {
    recs.push({ name: 'PETG', reason: 'Matériau polyvalent par défaut.', confidence: 0.7 });
  }
  return recs.slice(0, 3);
}
