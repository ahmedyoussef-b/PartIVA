import { callGroq, getGroqApiKey } from './groq-client';
import Anthropic from '@anthropic-ai/sdk';

// ... existing GroqProvider

// E72-B : Provider Claude préparé mais inactif.
// Pour l'activer : ajouter à availableProviders et configurer ANTHROPIC_API_KEY.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ClaudeProvider implements AIProvider {
  id = 'claude';
  name = 'Claude (Payant)';
  isAvailable = !!process.env.ANTHROPIC_API_KEY;
  tier: 'free' | 'paid' = 'paid';
  isPaid = true;
  private client: Anthropic | null = null;

  constructor() {
    if (this.isAvailable) {
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  async chat(messages: AIMessage[], context?: unknown): Promise<string> {
    if (!this.isAvailable || !this.client) throw new Error('Claude API key is not configured.');
    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: messages.map((m) => ({
        role: m.role === 'system' ? 'user' : m.role,
        content: m.content,
      })),
      system: `Contexte: ${JSON.stringify(context)}`,
    });
    const block = response.content[0];
    return block && block.type === 'text' ? block.text : '';
  }
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  id: string;
  name: string;
  isAvailable: boolean;
  tier: 'free' | 'paid';
  isPaid: boolean;
  chat(messages: AIMessage[], context?: unknown): Promise<string>;
}

class GroqProvider implements AIProvider {
  id = 'groq';
  name = 'Groq';
  isAvailable = !!getGroqApiKey();
  tier: 'free' | 'paid' = 'free';
  isPaid = false;
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
