import type { SourceConnector } from '@/lib/connectors/types';

/**
 * Source unique des poids inter-sources (D-E4-2).
 *
 * Poids de la source pour le score d'agrégation (D-E3-23) :
 * local_db = 1.0 (données métier), wikidata = 0.8 (référence),
 * traceparts = 0.6 (catalogue fabricant).
 *
 * Les timeouts (D-E3-31) sont bornés par le timeout global
 * de l'agrégateur (5s) — une source lente peut spécifier
 * un timeout plus long, mais reste bornée.
 *
 * Distinct de `DEFAULT_WEIGHTS` (src/lib/scoring.ts) qui
 * pondère les critères intra-candidat (text/reference/specs/
 * dimensions/photo) — les deux échelles sont indépendantes.
 */
export const SOURCE_WEIGHTS: Record<
  SourceConnector['source'],
  { weight: number; timeoutMs: number }
> = {
  local_db: { weight: 1.0, timeoutMs: 2_000 },
  wikidata: { weight: 0.8, timeoutMs: 10_000 },
  traceparts: { weight: 0.6, timeoutMs: 3_000 },
} as const;

export type ScoringSource = keyof typeof SOURCE_WEIGHTS;
