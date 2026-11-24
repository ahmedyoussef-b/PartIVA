// Métadonnées des fournisseurs IA utilisables côté client.
// Ce module ne doit importer AUCUN code serveur (groq-client, prisma, SDK payants) :
// il est inclus dans le bundle navigateur via AssistantZone.

export interface AIProviderMeta {
  id: string;
  name: string;
  tier: 'free' | 'paid';
}

// Liste alignée sur `availableProviders` (src/lib/ai/providers.ts).
export const providerOptions: AIProviderMeta[] = [{ id: 'groq', name: 'Groq', tier: 'free' }];
