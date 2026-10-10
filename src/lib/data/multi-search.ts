import {
  searchParts,
  searchPartsByReference,
  searchPartsBySpecs,
  searchPartsByDimensions,
} from '@/lib/data/search';
import { searchPartsByPhoto } from '@/lib/data/part-embeddings';
import { computeImageEmbedding, EmbeddingError } from '@/lib/embeddings';
import {
  computeScore,
  minMaxNormalize,
  REFERENCE_EXACT_SCORE,
  REFERENCE_PREFIX_SCORE,
  loadScoringWeights,
  type ScoringBreakdown,
} from '@/lib/scoring';

export type MultiSearchParams = {
  q?: string;
  reference?: string;
  specs?: string;
  specKey?: string;
  min?: number;
  max?: number;
  dimensionKey?: string;
  matchMode?: 'nominal' | 'tolerance';
  photoBuffer?: Buffer;
  clientId?: string;
  limit?: number;
};

export type MultiSearchResult = {
  id: string;
  ptvReference: string | null;
  partNumber: string | null;
  name: string | null;
  status: string;
  score: number;
  breakdown: ScoringBreakdown;
};

type IntermediateEntry = {
  id: string;
  ptvReference: string | null;
  partNumber: string | null;
  name: string | null;
  status: string;
  signals: {
    text?: number;
    reference?: number;
    specs?: number;
    dimensions?: number;
    photo?: number;
  };
};

export async function multiSearch(params: MultiSearchParams): Promise<MultiSearchResult[]> {
  const { clientId, limit = 20 } = params;
  const entries = new Map<string, IntermediateEntry>();

  const ensureEntry = (id: string): IntermediateEntry => {
    let entry = entries.get(id);
    if (!entry) {
      entry = {
        id,
        ptvReference: null,
        partNumber: null,
        name: null,
        status: 'DRAFT',
        signals: {},
      };
      entries.set(id, entry);
    }
    return entry;
  };

  // --- Texte ---
  if (params.q) {
    const results = await searchParts(params.q, { clientId, limit: limit * 2 });
    const ranks = results.map((r) => r.rank);
    const normalized = minMaxNormalize(ranks);
    results.forEach((r, i) => {
      const entry = ensureEntry(r.id);
      entry.ptvReference = r.ptvReference;
      entry.partNumber = r.partNumber;
      entry.name = r.name;
      entry.status = r.status;
      entry.signals.text = normalized[i];
    });
  }

  // --- Référence ---
  if (params.reference) {
    const results = await searchPartsByReference(params.reference, {
      clientId,
      limit: limit * 2,
    });
    results.forEach((r) => {
      const entry = ensureEntry(r.id);
      entry.ptvReference = r.ptvReference;
      entry.partNumber = r.partNumber;
      entry.name = r.name;
      entry.status = r.status;
      entry.signals.reference =
        r.matchType === 'exact' ? REFERENCE_EXACT_SCORE : REFERENCE_PREFIX_SCORE;
    });
  }

  // --- Specs ---
  if (params.specs) {
    const results = await searchPartsBySpecs(params.specs, {
      key: params.specKey,
      clientId,
      limit: limit * 2,
    });
    const ranks = results.map((r) => r.rank);
    const normalized = minMaxNormalize(ranks);
    results.forEach((r, i) => {
      const entry = ensureEntry(r.id);
      entry.ptvReference = r.ptvReference;
      entry.partNumber = r.partNumber;
      entry.name = r.name;
      entry.status = r.status;
      entry.signals.specs = normalized[i];
    });
  }

  // --- Dimensions (signal binaire) ---
  if (params.min !== undefined || params.max !== undefined) {
    const results = await searchPartsByDimensions({
      min: params.min,
      max: params.max,
      key: params.dimensionKey,
      matchMode: params.matchMode ?? 'nominal',
      clientId,
      limit: limit * 2,
    });
    results.forEach((r) => {
      const entry = ensureEntry(r.id);
      entry.ptvReference = r.ptvReference;
      entry.partNumber = r.partNumber;
      entry.name = r.name;
      entry.status = r.status;
      entry.signals.dimensions = 1;
    });
  }

  // --- Photo (exclue si token absent ou buffer absent) ---
  if (params.photoBuffer) {
    try {
      const vector = await computeImageEmbedding(params.photoBuffer);
      const results = await searchPartsByPhoto(vector, { clientId, limit: limit * 2 });
      results.forEach((r) => {
        const entry = ensureEntry(r.id);
        entry.ptvReference = r.ptvReference;
        entry.partNumber = r.partNumber;
        entry.name = r.name;
        entry.status = r.status;
        entry.signals.photo = r.similarity;
      });
    } catch (cause) {
      if (cause instanceof EmbeddingError && cause.code === 'MISSING_TOKEN') {
        // Photo exclue silencieusement — renormalisation gérée par computeScore
      } else {
        throw cause;
      }
    }
  }

  const weights = await loadScoringWeights();

  const scored: MultiSearchResult[] = [];
  entries.forEach((entry) => {
    const { global, breakdown } = computeScore(entry.signals, weights);
    scored.push({
      id: entry.id,
      ptvReference: entry.ptvReference,
      partNumber: entry.partNumber,
      name: entry.name,
      status: entry.status,
      score: global,
      breakdown,
    });
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
