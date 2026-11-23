// Multi-provider LLM client with automatic fallback.
// Providers are tried in priority order; on rate-limit / server error / network
// failure, the next configured provider is used. Each provider is OpenAI-compatible.

import { GroqMessage, GroqRequest, GroqResponse } from './types';

export type LLMProvider = {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
};

export function getGroqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY?.trim() || undefined;
}

// Cooldown par fournisseur (en mémoire, par processus).
const providerCooldown = new Map<string, number>();

function cooldownMsFor(status: number, errorText: string): number {
  const lower = errorText.toLowerCase();
  if (lower.includes('per day') || lower.includes('quota') || lower.includes('daily')) {
    // Quota journalier épuisé : on attend jusqu'au lendemain (max 24h).
    return 24 * 60 * 60 * 1000;
  }
  if (status === 429) {
    return 5 * 60 * 1000; // rate-limit court
  }
  return 0;
}

function buildProviders(primaryApiKey?: string): LLMProvider[] {
  const list: LLMProvider[] = [];

  const groqKey = primaryApiKey?.trim() || process.env.GROQ_API_KEY?.trim() || '';
  if (groqKey) {
    list.push({
      name: 'groq',
      baseUrl: (process.env.GROQ_BASE_URL?.trim() || 'https://api.groq.com/openai/v1').replace(
        /\/$/,
        '',
      ),
      apiKey: groqKey,
      model: process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b',
    });
  }

  const cerebrasKey = process.env.CEREBRAS_API_KEY?.trim();
  if (cerebrasKey) {
    list.push({
      name: 'cerebras',
      baseUrl: (process.env.CEREBRAS_BASE_URL?.trim() || 'https://api.cerebras.ai/v1').replace(
        /\/$/,
        '',
      ),
      apiKey: cerebrasKey,
      model: process.env.CEREBRAS_MODEL?.trim() || 'gpt-oss-120b',
    });
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouterKey) {
    list.push({
      name: 'openrouter',
      baseUrl: (process.env.OPENROUTER_BASE_URL?.trim() || 'https://openrouter.ai/api/v1').replace(
        /\/$/,
        '',
      ),
      apiKey: openrouterKey,
      model: process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-oss-120b',
    });
  }

  const googleKey = process.env.GOOGLE_GENAI_API_KEY?.trim();
  if (googleKey) {
    list.push({
      name: 'google',
      baseUrl: (
        process.env.GOOGLE_GENAI_BASE_URL?.trim() ||
        'https://generativelanguage.googleapis.com/v1beta/openai'
      ).replace(/\/$/, ''),
      apiKey: googleKey,
      model: process.env.GOOGLE_GENAI_MODEL?.trim() || 'gemini-3.8-flash',
    });
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    list.push({
      name: 'openai',
      baseUrl: (process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(
        /\/$/,
        '',
      ),
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
    });
  }

  return list;
}

export async function callGroq(
  messages: GroqMessage[],
  apiKey?: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
    responseFormat?: 'json_object';
  },
): Promise<{ content: string; model: string; provider: string }> {
  const providers = buildProviders(apiKey);
  if (providers.length === 0) {
    throw new Error('Aucun fournisseur LLM configuré (GROQ_API_KEY, CEREBRAS_API_KEY, ...)');
  }

  const timeoutMs = options?.timeout ?? 30000;
  const temperature = options?.temperature ?? 0.2;
  const maxTokens = options?.maxTokens ?? 2048;

  let lastError: unknown = null;

  // Cooldown : un fournisseur qui a renvoyé un 429 / quota épuisé est ignoré
  // pendant un certain temps pour éviter de perdre du temps à le retenter.
  const now = Date.now();
  const filteredProviders = providers.filter((p) => {
    const until = providerCooldown.get(p.name) ?? 0;
    if (until > now) {
      console.warn(`[LLM] ${p.name} en cooldown jusqu'à ${new Date(until).toISOString()}, ignoré`);
      return false;
    }
    return true;
  });
  const candidates = filteredProviders.length > 0 ? filteredProviders : providers;

  for (const provider of candidates) {
    const requestedModel = options?.model;
    // Use the caller's model hint only for the primary (groq) provider;
    // fallback providers use their own default model.
    const model = provider.name === 'groq' && requestedModel ? requestedModel : provider.model;

    const requestBody: GroqRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
      ...(options?.responseFormat ? { response_format: { type: options.responseFormat } } : {}),
    };

    try {
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        const err = new Error(
          `LLM ${provider.name}: ${response.status} ${response.statusText} - ${errorText}`,
        );
        (err as { status?: number }).status = response.status;
        const cd = cooldownMsFor(response.status, errorText);
        if (cd > 0) {
          providerCooldown.set(provider.name, Date.now() + cd);
          console.warn(`[LLM] ${provider.name} en cooldown ${Math.round(cd / 60000)} min`);
        }
        console.warn(`[LLM] ${provider.name} failed (${response.status}), trying next provider`);
        lastError = err;
        continue;
      }

      const data: GroqResponse = await response.json();
      if (!data.choices || data.choices.length === 0 || !data.choices[0]) {
        const err = new Error(`LLM ${provider.name}: aucune réponse`);
        console.warn(`[LLM] ${provider.name} empty response, trying next provider`);
        lastError = err;
        continue;
      }

      const choice = data.choices[0];
      const content = choice.message?.content;
      if (typeof content !== 'string') {
        const err = new Error(`LLM ${provider.name}: contenu invalide`);
        console.warn(`[LLM] ${provider.name} invalid content, trying next provider`);
        lastError = err;
        continue;
      }

      return { content, model: data.model || model, provider: provider.name };
    } catch (e) {
      console.warn(`[LLM] ${provider.name} error, trying next provider`, e);
      lastError = e;
      continue;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error('Tous les fournisseurs LLM ont échoué');
}

// Alias for compatibility
export const callLLM = callGroq;
