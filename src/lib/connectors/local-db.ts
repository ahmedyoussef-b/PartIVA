import { SourceConnector } from './types';
import { SOURCE_WEIGHTS } from '@/lib/scoring/weights';
import { getSearchCandidates } from '@/lib/data/search-candidates';

/**
 * Connecteur local_db (D-E3-26).
 *
 * Sémantique déléguée (D5) : recherche full-text Prisma
 * (ILIKE sur name/reference via getSearchCandidates).
 *
 * Source primaire (weight 1.0) — données métier PartIVA.
 * getSearchCandidates retourne déjà des SearchCandidate
 * valides : aucune adaptation nécessaire.
 */
export const localDbConnector: SourceConnector = {
  source: 'local_db',
  weight: SOURCE_WEIGHTS.local_db.weight,
  timeoutMs: SOURCE_WEIGHTS.local_db.timeoutMs, // PostgreSQL local rapide (D-E3-31)

  isAvailable(): boolean {
    return true;
  },

  async search(query, options = {}) {
    const { limit = 20 } = options;
    const candidates = await getSearchCandidates({ source: 'local_db' });
    const filtered = candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.reference.toLowerCase().includes(query.toLowerCase()),
    );
    return filtered.slice(0, limit);
  },
};
