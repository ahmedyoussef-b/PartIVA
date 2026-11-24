// Multi-provider LLM client with automatic fallback.
// Providers are tried in priority order; on rate-limit / server error / network
// failure, the next configured provider is used. Each provider is OpenAI-compatible.

import { GroqMessage, GroqRequest, GroqResponse } from './types';
import { addDailyTokens, assertDailyBudget } from '@/lib/utils/llm-budget';

export type LLMProvider = {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
};

export function getGroqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY?.trim() || undefined;
}

// Cooldown par fournisseur : L1 mémoire + L2 base de données (partagé serverless).
const providerCooldown = new Map<string, number>();
const DB_TIMEOUT_MS = 800;
let totalTokensUsed = 0;

// La base peut être lente/indisponible : le cooldown L2 ne doit jamais bloquer l'appel LLM.
function withDbTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), DB_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

async function getCooldownUntil(provider: string): Promise<number> {
  const memory = providerCooldown.get(provider) ?? 0;
  if (memory > Date.now()) return memory;

  try {
    const { prisma } = await import('@/lib/prisma');
    const row = await withDbTimeout(
      prisma.llmProviderCooldown.findUnique({ where: { provider } }),
      null,
    );
    if (!row) return 0;
    const until = row.until.getTime();
    if (until > Date.now()) {
      providerCooldown.set(provider, until);
      return until;
    }
    await withDbTimeout(
      prisma.llmProviderCooldown.delete({ where: { provider } }).catch(() => undefined),
      undefined,
    );
    return 0;
  } catch {
    return 0;
  }
}

async function setCooldown(provider: string, until: number, reason?: string): Promise<void> {
  providerCooldown.set(provider, until);
  try {
    const { prisma } = await import('@/lib/prisma');
    await withDbTimeout(
      prisma.llmProviderCooldown.upsert({
        where: { provider },
        create: { provider, until: new Date(until), reason: reason ?? null },
        update: { until: new Date(until), reason: reason ?? null },
      }),
      undefined,
    );
  } catch {
    // best-effort : le cooldown mémoire protège l'instance courante
  }
}

async function clearCooldown(provider: string): Promise<void> {
  providerCooldown.delete(provider);
  try {
    const { prisma } = await import('@/lib/prisma');
    await withDbTimeout(
      prisma.llmProviderCooldown.delete({ where: { provider } }).catch(() => undefined),
      undefined,
    );
  } catch {
    // ignore
  }
}

function cooldownMsFor(status: number, errorText: string): number {
  const lower = errorText.toLowerCase();
  if (lower.includes('per day') || lower.includes('quota') || lower.includes('daily')) {
    // Quota journalier : on attend le prochain minuit UTC (au lieu de 24h pleines).
    const now = Date.now();
    const nextUtcMidnight = Date.UTC(
      new Date(now).getUTCFullYear(),
      new Date(now).getUTCMonth(),
      new Date(now).getUTCDate() + 1,
      0,
      5,
      0,
    );
    return Math.max(5 * 60 * 1000, nextUtcMidnight - now);
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

  const togetherKey = process.env.TOGETHER_API_KEY?.trim();
  if (togetherKey) {
    list.push({
      name: 'together',
      baseUrl: (process.env.TOGETHER_BASE_URL?.trim() || 'https://api.together.xyz/v1').replace(
        /\/$/,
        '',
      ),
      apiKey: togetherKey,
      model: process.env.TOGETHER_MODEL?.trim() || 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    });
  }

  const deepinfraKey = process.env.DEEPINFRA_API_KEY?.trim();
  if (deepinfraKey) {
    list.push({
      name: 'deepinfra',
      baseUrl: (
        process.env.DEEPINFRA_BASE_URL?.trim() || 'https://api.deepinfra.com/v1/openai'
      ).replace(/\/$/, ''),
      apiKey: deepinfraKey,
      model: process.env.DEEPINFRA_MODEL?.trim() || 'meta-llama/Meta-Llama-3.1-70B-Instruct',
    });
  }

  const mistralKey = process.env.MISTRAL_API_KEY?.trim();
  if (mistralKey) {
    list.push({
      name: 'mistral',
      baseUrl: (process.env.MISTRAL_BASE_URL?.trim() || 'https://api.mistral.ai/v1').replace(
        /\/$/,
        '',
      ),
      apiKey: mistralKey,
      model: process.env.MISTRAL_MODEL?.trim() || 'mistral-small-latest',
    });
  }

  const sambanovaKey = process.env.SAMBANOVA_API_KEY?.trim();
  if (sambanovaKey) {
    list.push({
      name: 'sambanova',
      baseUrl: (process.env.SAMBANOVA_BASE_URL?.trim() || 'https://api.sambanova.ai/v1').replace(
        /\/$/,
        '',
      ),
      apiKey: sambanovaKey,
      model: process.env.SAMBANOVA_MODEL?.trim() || 'Meta-Llama-3.3-70B-Instruct',
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

export function hasLlmProvider(): boolean {
  return buildProviders().length > 0;
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
  if (process.env.AI_MOCK === 'true') {
    return { content: '{}', model: 'mock', provider: 'mock' };
  }
  await assertDailyBudget();
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
  const cooldownStates = await Promise.all(
    providers.map(async (provider) => ({
      provider,
      until: await getCooldownUntil(provider.name),
    })),
  );
  const filteredProviders = cooldownStates
    .filter(({ provider, until }) => {
      if (until > now) {
        console.warn(
          `[LLM] ${provider.name} en cooldown jusqu'à ${new Date(until).toISOString()}, ignoré`,
        );
        return false;
      }
      return true;
    })
    .map(({ provider }) => provider);
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
          await setCooldown(
            provider.name,
            Date.now() + cd,
            `${response.status} ${errorText}`.slice(0, 200),
          );
          console.warn(`[LLM] ${provider.name} en cooldown ${Math.round(cd / 60000)} min`);
        }
        console.warn(`[LLM] ${provider.name} failed (${response.status}), trying next provider`);
        lastError = err;
        continue;
      }

      const data: GroqResponse = await response.json();
      const usage = (data as { usage?: GroqResponse['usage'] }).usage;
      if (usage) {
        totalTokensUsed += usage.total_tokens ?? 0;
        console.info('[LLM:usage]', {
          provider: provider.name,
          model,
          prompt: usage.prompt_tokens ?? 0,
          completion: usage.completion_tokens ?? 0,
          total: usage.total_tokens ?? 0,
          cumulated: totalTokensUsed,
        });
        addDailyTokens(usage.total_tokens ?? 0);
      }
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

      if (providerCooldown.has(provider.name)) {
        await clearCooldown(provider.name);
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
