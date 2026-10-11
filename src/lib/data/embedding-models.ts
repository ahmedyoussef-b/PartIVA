/**
 * Catalogue des modèles d'embedding (D-E4-5, D-embedding-model-catalog).
 *
 * Modèle actif : clip-ViT-B-32 (D125-bis) — 768 dimensions.
 * Les alternatives sont documentées pour une future session
 * de sélection (UI admin de choix du modèle).
 *
 * Critères de sélection :
 * - Dimensions : doit correspondre à la colonne `vector(768)`
 *   (Prisma `Unsupported("vector(768)")` — migration si changement)
 * - Langue : multilinge recommandé (catalogue FR/EN)
 * - Type : image (recherche par photo E2-S05)
 *
 * R.5.12 : ce catalogue est la source de vérité pour les
 * modèles supportés — toute ajout doit mettre à jour
 * `HF_DIMENSION` (src/lib/embeddings.ts) si dimensions ≠ 768.
 */

export interface EmbeddingModelInfo {
  /** Identifiant Hugging Face (`organization/model`). */
  readonly id: string;
  /** Libellé lisible. */
  readonly label: string;
  /** Dimensions du vecteur. */
  readonly dimensions: number;
  /** Type d'entrée. */
  readonly type: 'image' | 'text' | 'multi';
  /** Statut dans le projet. */
  readonly status: 'active' | 'alternative' | 'deprecated';
  /** Note (performance / coût). */
  readonly notes: string;
}

export const EMBEDDING_MODELS: readonly EmbeddingModelInfo[] = [
  {
    id: 'sentence-transformers/clip-ViT-B-32',
    label: 'CLIP ViT-B/32',
    dimensions: 768,
    type: 'image',
    status: 'active',
    notes: 'Modèle actif (E2-S05). Image → 768 dim. Bon équilibre performance/coût.',
  },
  {
    id: 'sentence-transformers/clip-ViT-B-16',
    label: 'CLIP ViT-B/16',
    dimensions: 768,
    type: 'image',
    status: 'alternative',
    notes: 'Plus précis que B/32, plus lent. Même dimension (768) — compatible sans migration.',
  },
  {
    id: 'sentence-transformers/siglip-base-patch16-224',
    label: 'SigLIP Base',
    dimensions: 768,
    type: 'image',
    status: 'alternative',
    notes: 'Successeur de CLIP (Google). Même dimension (768) — compatible sans migration.',
  },
  {
    id: 'nomic-ai/nomic-embed-text-v1.5',
    label: 'Nomic Embed Text',
    dimensions: 768,
    type: 'text',
    status: 'alternative',
    notes: 'Texte uniquement — non compatible avec la recherche par photo (E2-S05).',
  },
] as const;

/** Modèle actif (D125-bis). */
export const ACTIVE_EMBEDDING_MODEL = EMBEDDING_MODELS[0];

/**
 * Vérifie qu'un modèle est compatible avec la colonne `vector(768)`.
 * Retourne false si les dimensions diffèrent (nécessiterait une migration).
 */
export function isEmbeddingModelCompatible(model: EmbeddingModelInfo): boolean {
  return model.dimensions === 768;
}
