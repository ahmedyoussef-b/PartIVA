import type { SourceConnector } from '@/lib/connectors/types';

/**
 * Source unique des poids inter-sources (D-E4-2).
 *
 * R.5.12 — TAXONOMIE DES POIDS (deux familles distinctes) :
 *
 * 1. **Poids INTER-SOURCES** (ce fichier, `SOURCE_WEIGHTS`) :
 *    pondèrent les sources dans le pipeline d'agrégation
 *    (E4-S03, `computeAggregationScore()`). Répondent à
 *    « quelle source est la plus fiable ? ».
 *    - local_db = 1.0 (données métier PartIVA)
 *    - wikidata = 0.8 (référence)
 *    - traceparts = 0.6 (catalogue fabricant)
 *    - tecdoc = 0.5 (référentiel automobile, mock —
 *      contrat commercial requis, D-tecdoc-credentials)
 *    - industrial_catalog = 0.55 (catalogue industriel
 *      dataset HF `swan07/industrial-parts-data`, E6-S05)
 *
 * 2. **Poids INTRA-CANDIDAT** (`DEFAULT_WEIGHTS`, src/lib/scoring.ts) :
 *    pondèrent les critères d'un candidat (E2-S06, `computeScore()`).
 *    Répondent à « quel critère est le plus discriminant ? ».
 *    - text, reference, specs, dimensions, photo (0.2 chacun)
 *
 * Les deux familles COEXISTENT et ne doivent PAS être confondues.
 * `SOURCE_WEIGHTS` est stocké ici (code, read-only en E4-S04) ;
 * `DEFAULT_WEIGHTS` est persisté en DB (`ScoringWeights` Prisma).
 *
 * Les timeouts (D-E3-31) sont bornés par le timeout global
 * de l'agrégateur (5s) — une source lente peut spécifier
 * un timeout plus long, mais reste bornée.
 */
export const SOURCE_WEIGHTS: Record<
  SourceConnector['source'],
  { weight: number; timeoutMs: number }
> = {
  local_db: { weight: 1.0, timeoutMs: 2_000 },
  wikidata: { weight: 0.8, timeoutMs: 10_000 },
  traceparts: { weight: 0.6, timeoutMs: 3_000 },
  tecdoc: { weight: 0.5, timeoutMs: 3_000 },
  industrial_catalog: { weight: 0.55, timeoutMs: 5_000 },
  '3dcarparts': { weight: 0.45, timeoutMs: 5_000 },
} as const;

export type ScoringSource = keyof typeof SOURCE_WEIGHTS;
