import { callGroq, getGroqApiKey } from '@/lib/ai/groq-client';
export interface NormalizedQuery {
  original: string;
  keywords: string[];
  type: string | null;
  material: string | null;
  english: string;
}
export async function normalizeQuery(userInput: string): Promise<NormalizedQuery> {
  const fallback: NormalizedQuery = {
    original: userInput,
    keywords: [],
    type: null,
    material: null,
    english: userInput,
  };
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    console.warn('[query-normalizer] GROQ_API_KEY absent — fallback sur la requête brute');
    return fallback;
  }
  const prompt = `Tu es un assistant technique pour un atelier d'usinage. L'utilisateur décrit une pièce.Extrais les informations suivantes au format JSON :- keywords: 3 à 5 mots-clés techniques en anglais (ex: "screw", "mirror", "bearing")- type: le type de pièce (ex: "screw", "mirror", "bearing", "unknown")- material: le matériau si mentionné (ex: "plastic", "steel", null)- english: une traduction courte en anglais de la descriptionDescription : "${userInput}"Réponds UNIQUEMENT avec le JSON, sans texte autour.`;
  try {
    const response = await callGroq([{ role: 'user', content: prompt }], apiKey, {
      model: 'openai/gpt-oss-120b',
      temperature: 0.2,
      maxTokens: 512,
    });
    const content = response.content || '{}';
    const parsed = JSON.parse(content);
    return {
      original: userInput,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      type: parsed.type || null,
      material: parsed.material || null,
      english: parsed.english || userInput,
    };
  } catch (error) {
    console.warn('[query-normalizer] Erreur Groq:', error);
    return fallback;
  }
}
