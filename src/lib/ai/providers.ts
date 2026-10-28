import { callGroq, getGroqApiKey } from './groq-client';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  id: string;
  name: string;
  isAvailable: boolean;
  tier: 'free' | 'paid';
  chat(messages: AIMessage[], context?: unknown): Promise<string>;
}

class GroqProvider implements AIProvider {
  id = 'groq';
  name = 'Groq';
  isAvailable = !!getGroqApiKey();
  tier: 'free' | 'paid' = 'free';
  async chat(messages: AIMessage[], context?: unknown): Promise<string> {
    const apiKey = getGroqApiKey();
    if (!apiKey) throw new Error('GROQ_API_KEY manquant');
    const system = context ? `Contexte: ${JSON.stringify(context)}` : 'Assistant technique';
    const { content } = await callGroq([{ role: 'system', content: system }, ...messages], apiKey);
    return content;
  }
}

export const availableProviders: AIProvider[] = [new GroqProvider()];

export function getProvider(id?: string): AIProvider {
  return availableProviders.find((p) => p.id === (id ?? 'groq')) ?? availableProviders[0]!;
}
