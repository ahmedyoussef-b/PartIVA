import type { SearchCandidate } from '@/schemas/search';

export interface ConnectorDescriptor {
  id: string; // 'step_parts'
  label: string; // 'STEP Parts'
  description: string;
  mode: 'real' | 'mock';
  weight: number;
  timeoutMs: number;

  // Configuration de l'API
  api: {
    baseUrl: string; // 'https://api.step.parts'
    searchPath: string; // '/v1/parts'
    auth?: 'none' | 'bearer' | 'api-key';
    apiKeyEnv?: string; // 'STEP_PARTS_API_KEY' (si besoin futur)
  };

  // Mapping : transformer la réponse de l'API en SearchCandidate
  mapper: (rawItem: unknown, context: { query: string }) => SearchCandidate | null;

  // Filtre optionnel : quels items de la réponse sont pertinents
  extractItems: (rawResponse: unknown) => unknown[];

  /**
   * Optionnel : si défini, remplace complètement le fetch HTTP.
   * Utilisé pour les sources locales (pas d'API externe).
   */
  customSearch?: (
    query: string,
    options?: { limit?: number; signal?: AbortSignal },
  ) => Promise<SearchCandidate[]>;
}
