import type { SearchCandidate } from '@/schemas/search';

/**
 * Interface commune des connecteurs de sources externes (D-E3-20).
 * Chaque connecteur expose : source, weight, search, isAvailable.
 *
 * Les sémantiques de recherche hétérogènes (label exact Wikidata,
 * full-text TraceParts, full-text local_db) sont DÉLÉGUÉES à chaque
 * connecteur (D5 / D-E3-20). L'agrégateur ne connaît que
 * SearchCandidate[] — il ne sait pas comment chaque source cherche.
 *
 * CADENAS (D-E3-19) et OpenSERP (D-openserp-instance, Docker absent)
 * sont EXCLUS des sources actives — ils ne sont pas des
 * SourceConnector tant qu'ils ne sont pas fonctionnels.
 */
export interface SourceConnector {
  /** Source dans SearchSourceSchema. */
  readonly source: 'local_db' | 'wikidata' | 'traceparts';

  /**
   * Poids de la source pour le score d'agrégation (D-E3-23).
   * local_db = 1.0 (données métier), wikidata = 0.8 (référence),
   * traceparts = 0.6 (catalogue fabricant).
   */
  readonly weight: number;

  /**
   * Vérifie si la source est disponible (credentials, endpoint).
   * Retourne false si la source est en mode mock non fonctionnel
   * ou si l'endpoint est injoignable.
   */
  isAvailable(): boolean;

  /**
   * Recherche dans la source.
   * @param query - Terme de recherche
   * @param options - Limite, signal d'annulation (timeout global)
   * @returns Liste de candidats normalisés (SearchCandidate[])
   */
  search(
    query: string,
    options?: { limit?: number; signal?: AbortSignal },
  ): Promise<SearchCandidate[]>;
}
