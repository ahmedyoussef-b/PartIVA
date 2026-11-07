import type { SourceConnector } from './types';
import type { SearchCandidate } from '@/schemas/search';
import { SOURCE_WEIGHTS } from '@/lib/scoring/weights';
import { searchPartsByPhoto } from '@/lib/data/part-embeddings';
import { computeImageEmbedding, isEmbeddingConfigured, EmbeddingError } from '@/lib/embeddings';

/**
 * Connecteur "Recherche Géométrique IA".
 *
 * Utilise la recherche par similarité d'embedding (pgvector).
 * Source : part_images.embedding (768 dims, CLIP ou SigLIP).
 *
 * Note : computeImageEmbedding() attend une URL d'image (ou Buffer),
 * mais accepte aussi une query texte (le provider CLIP est multimodal).
 * On passe donc la query comme "image" — c'est ce qui permet le
 * cross-modal text → image.
 *
 * Si HF_API_URL/HF_API_TOKEN ne sont pas configurés, ou si la DB
 * n'a aucun embedding, retourne [] avec un warning explicite.
 */
export const geometricConnector: SourceConnector = {
  source: 'geometric' as const,
  mode: 'real' as const,
  weight: SOURCE_WEIGHTS.geometric?.weight ?? 0.7,
  timeoutMs: SOURCE_WEIGHTS.geometric?.timeoutMs ?? 8000,

  isAvailable(): boolean {
    return isEmbeddingConfigured();
  },

  async search(query, options = {}) {
    const { limit = 20, signal } = options;
    const trimmed = query.trim();
    if (!trimmed) return [];

    if (!isEmbeddingConfigured()) {
      console.warn('[geometric] non configuré — HF_API_URL/HF_API_TOKEN absents');
      return [];
    }

    try {
      // CLIP accepte une URL d'image OU une chaîne texte comme input.
      const embedding = await computeImageEmbedding(trimmed);

      if (signal?.aborted) return [];

      const results = await searchPartsByPhoto(embedding, { limit });

      return results.map((r): SearchCandidate => {
        const score = Math.min(1, Math.max(0, r.similarity));
        return {
          id: `geometric:${r.id}:${r.imageId}`,
          source: 'geometric' as const,
          reference: r.ptvReference ?? r.partNumber,
          name: r.name,
          imageUrl: r.imageUrl,
          cadAvailable: false,
          datasheetAvailable: false,
          scores: { global: score, geometry: score },
          metadata: {
            partId: r.id,
            partNumber: r.partNumber,
            status: r.status,
            similarity: r.similarity,
            provider: 'geometric-embedding',
          },
        };
      });
    } catch (e) {
      if (e instanceof EmbeddingError) {
        console.warn(`[geometric] ${e.code}: ${e.message}`);
      } else {
        console.warn('[geometric] erreur:', e instanceof Error ? e.message : String(e));
      }
      return [];
    }
  },
};
