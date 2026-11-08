import type { ConnectorDescriptor } from '../types';
import type { SearchCandidate } from '@/schemas/search';

// Types locaux pour la réponse de l'API step.parts
interface StepPartsItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  family?: string;
  tags?: string[];
  aliases?: string[];
  attributes?: Record<string, unknown>;
  standard?: { designation?: string; body?: string };
  stepUrl?: string;
  glbUrl?: string;
  pngUrl?: string;
  pageUrl?: string;
  apiUrl?: string;
}

interface StepPartsResponse {
  items?: StepPartsItem[];
}

function isStepPartsResponse(value: unknown): value is StepPartsResponse {
  return typeof value === 'object' && value !== null && 'items' in value;
}

export const stepPartsDescriptor: ConnectorDescriptor = {
  id: 'step_parts',
  label: 'STEP Parts',
  description: 'Catalogue open source de pièces CAO (visserie, roulements, profilés...)',
  mode: 'real',
  weight: 0.65,
  timeoutMs: 10_000,

  api: {
    baseUrl: 'https://api.step.parts',
    searchPath: '/v1/parts',
    auth: 'none',
  },

  extractItems: (raw: unknown): unknown[] => {
    if (isStepPartsResponse(raw)) return raw.items ?? [];
    return [];
  },

  mapper: (item: unknown): SearchCandidate | null => {
    if (typeof item !== 'object' || item === null) return null;
    const it = item as StepPartsItem;
    if (!it.id || !it.name) return null;

    return {
      id: `step_parts:${it.id}`,
      source: 'step_parts',
      reference: it.standard?.designation ?? it.id,
      name: it.name,
      manufacturer: it.standard?.body ?? undefined,
      imageUrl: it.pngUrl ?? undefined,
      cadAvailable: Boolean(it.stepUrl),
      datasheetAvailable: false,
      scores: { global: 0.65 },
      metadata: {
        stepUrl: it.stepUrl,
        pageUrl: it.pageUrl,
        category: it.category,
        family: it.family,
        standard: it.standard?.designation,
        attributes: it.attributes,
      },
    };
  },
};
