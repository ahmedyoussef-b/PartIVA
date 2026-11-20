/**
 * @deprecated Utiliser src/lib/ai/groq-client.ts (GROQ_MODEL, JSON strict).
 * Conservé pour compatibilité (consommateur restant : src/lib/pcb/ai-engine.ts).
 */
// Client LLM isolé pour le PCB Studio
// Ne dépend PAS de use-ai-chat ni de src/lib/ai/ existant

export interface LlmResponse {
  content: string;
  error?: string;
}

export async function callPcbLlm(prompt: string): Promise<LlmResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { content: '', error: 'GROQ_API_KEY non configurée' };
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      return { content: '', error: `LLM error: ${res.status}` };
    }

    const data = await res.json();
    return { content: data.choices?.[0]?.message?.content ?? '' };
  } catch (e) {
    return { content: '', error: e instanceof Error ? e.message : 'Erreur LLM' };
  }
}
