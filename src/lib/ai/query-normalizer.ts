import { callGroq, getGroqApiKey, hasLlmProvider } from '@/lib/ai/groq-client';
import { getLlmCacheAsync, setLlmCacheAsync } from '@/lib/utils/llm-cache';
import { hashKey } from '@/lib/utils/llm-guard';

export interface NormalizedQuery {
  original: string;
  keywords: string[];
  type: string | null;
  material: string | null;
  english: string;
}

// Référence composant / MPN : déjà exploitable telle quelle, pas de LLM.
const PART_NUMBER_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]{2,}$/;

export async function normalizeQuery(userInput: string): Promise<NormalizedQuery> {
  const trimmed = userInput.trim();
  const cacheKey = `qnorm:${hashKey(trimmed)}`;
  const cached = await getLlmCacheAsync<NormalizedQuery>(cacheKey);
  if (cached) return cached;

  const fallback: NormalizedQuery = {
    original: userInput,
    keywords: [],
    type: null,
    material: null,
    english: userInput,
  };

  // Court-circuit déterministe : les MPN/références n'ont pas besoin de traduction.
  if (PART_NUMBER_RE.test(trimmed) && !trimmed.includes(' ')) {
    const direct: NormalizedQuery = {
      original: userInput,
      keywords: [trimmed],
      type: null,
      material: null,
      english: trimmed,
    };
    await setLlmCacheAsync(cacheKey, direct, 24 * 60 * 60 * 1000);
    return direct;
  }

  const apiKey = getGroqApiKey();
  if (!apiKey && !hasLlmProvider()) {
    console.warn('[query-normalizer] Aucun fournisseur LLM configuré — fallback requête brute');
    return fallback;
  }
  const prompt = `Tu es un assistant technique pour un atelier d'usinage. L'utilisateur décrit une pièce.Extrais les informations suivantes au format JSON :- keywords: 3 à 5 mots-clés techniques en anglais (ex: "screw", "mirror", "bearing")- type: le type de pièce (ex: "screw", "mirror", "bearing", "unknown")- material: le matériau si mentionné (ex: "plastic", "steel", null)- english: une traduction courte en anglais de la descriptionDescription : "${userInput}"Réponds UNIQUEMENT avec le JSON, sans texte autour.`;
  try {
    const response = await callGroq([{ role: 'user', content: prompt }], apiKey, {
      model: process.env.GROQ_MODEL,
      temperature: 0.2,
      maxTokens: 512,
    });
    const content = response.content || '{}';
    const parsed = JSON.parse(content);
    const result: NormalizedQuery = {
      original: userInput,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      type: parsed.type || null,
      material: parsed.material || null,
      english: parsed.english || userInput,
    };
    await setLlmCacheAsync(cacheKey, result, 24 * 60 * 60 * 1000);
    return result;
  } catch (error) {
    console.warn('[query-normalizer] Erreur Groq:', error);
    return fallback;
  }
}
