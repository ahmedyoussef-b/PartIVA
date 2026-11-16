// AI Engine mode guidé — propositions structurées pour le PCB Core
// Ne dépend PAS de use-ai-chat ni de src/lib/ai/ existant

import { callPcbLlm } from './llm-client';
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
  const prompt = `Tu es un ingénieur électronique expert. À partir des exigences suivantes, propose des composants électroniques et leurs connexions. Réponds en JSON avec un tableau "proposals" de {action, target, payload, reason}. Chaque proposition doit être justifiée techniquement. Exigences : ${JSON.stringify(answers)}`;

  const res = await callPcbLlm(prompt);
  if (res.error) {
    return { proposals: [], error: res.error };
  }

  try {
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
