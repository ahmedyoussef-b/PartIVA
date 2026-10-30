import { VisionInput, VisionResult } from './types';

export async function detectPartType(input: VisionInput): Promise<VisionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  console.log('GROQ_API_KEY present:', !!apiKey);
  const warnings: string[] = [];
  if (!apiKey || input.photoUrls.length === 0) {
    return {
      detectedType: null,
      confidence: 0,
      rawResponse: '',
      warnings: [!apiKey ? 'Clé API Groq manquante' : 'Aucune photo transmise'],
    };
  }
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: 'text',
      text: 'Tu es un expert en pièces mécaniques. Analyse l\'image et identifie le type de pièce (vis, engrenage, roulement, plaque, etc.). Réponds en JSON : { "type": string, "confidence": number }.',
    },
  ];
  for (const url of input.photoUrls.slice(0, 3)) {
    content.push({ type: 'image_url', image_url: { url } });
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b',
        messages: [{ role: 'user', content }],
        temperature: 0.2,
        max_tokens: 256,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      const t = await res.text();
      return {
        detectedType: null,
        confidence: 0,
        rawResponse: t,
        warnings: [`groq error ${res.status}`],
      };
    }
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? '';
    let detectedType: string | null = null;
    let confidence = 0;
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const j = JSON.parse(m[0]);
        detectedType = j.type ?? null;
        confidence = typeof j.confidence === 'number' ? j.confidence : 0;
      }
    } catch {
      warnings.push('parse error');
    }
    return { detectedType, confidence, rawResponse: raw, warnings };
  } catch (e) {
    return { detectedType: null, confidence: 0, rawResponse: '', warnings: [String(e)] };
  }
}
