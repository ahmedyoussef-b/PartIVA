// AI Engine mode guidé — propositions structurées pour le PCB Core
// Utilise le client multi-provider (`groq-client`) : fallback + cooldown.

import { callGroq, getGroqApiKey, hasLlmProvider } from '@/lib/ai/groq-client';
import type { RequirementAnswer } from './types';

export interface PcbProposalAction {
  action: 'add_component' | 'add_net' | 'modify_component' | 'remove_component';
  target: string;
  payload: Record<string, unknown>;
  reason: string;
  requires_validation: true;
}

export interface PcbProposalResult {
  proposals: PcbProposalAction[];
  error?: string;
}

export async function proposeFromRequirements(
  answers: RequirementAnswer[],
): Promise<PcbProposalResult> {
  const apiKey = getGroqApiKey();
  if (!hasLlmProvider()) {
    return { proposals: [], error: 'Aucun fournisseur LLM configuré' };
  }

  const prompt = `Tu es un ingénieur électronique expert. À partir des exigences suivantes, propose des composants électroniques et leurs connexions. Réponds en JSON avec un tableau "proposals" de {action, target, payload, reason}. Chaque proposition doit être justifiée techniquement. Exigences : ${JSON.stringify(answers)}`;

  try {
    const res = await callGroq([{ role: 'user', content: prompt }], apiKey, {
      model: process.env.GROQ_MODEL,
      temperature: 0.2,
      maxTokens: 2048,
      timeout: 30_000,
      responseFormat: 'json_object',
    });

    const parsed = JSON.parse(res.content);
    const proposals: PcbProposalAction[] = (parsed.proposals ?? []).map(
      (p: Record<string, unknown>) => ({
        action: p.action as PcbProposalAction['action'],
        target: (p.target as string) ?? 'pcb_project',
        payload: (p.payload as Record<string, unknown>) ?? {},
        reason: (p.reason as string) ?? '',
        requires_validation: true as const,
      }),
    );
    return { proposals };
  } catch {
    return { proposals: [], error: 'Réponse LLM non parsable' };
  }
}
