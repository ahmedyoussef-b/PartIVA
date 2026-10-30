import { VisionInput, VisionResult } from './types';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function loadImageAsBase64(url: string): Promise<{ url: string; warning?: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      return { url, warning: `Image inaccessible (${res.status}): ${url}` };
    }
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
      return {
        url,
        warning: `Image trop volumineuse (${Math.round(arrayBuffer.byteLength / 1024 / 1024)} Mo > 5 Mo): ${url}`,
      };
    }
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return { url: `data:${contentType};base64,${base64}` };
  } catch (e) {
    return { url, warning: `Echec de chargement de l'image: ${url} (${String(e)})` };
  }
}

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
  console.log('URLs reçues par vision:', input.photoUrls);
  const validUrls = input.photoUrls.filter((u) => u.startsWith('https://'));
  const blobUrls = input.photoUrls.filter((u) => u.startsWith('blob:'));
  if (blobUrls.length) {
    warnings.push(`${blobUrls.length} image(s) ignoree(s): URL blob non accessible cote serveur`);
  }
  if (validUrls.length === 0) {
    return {
      detectedType: null,
      confidence: 0,
      rawResponse: '',
      warnings: [...warnings, 'Aucune image publique valide pour l analyse'],
    };
  }
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: 'text',
      text: 'Tu es un expert en pièces mécaniques. Analyse l\'image et identifie le type de pièce (vis, engrenage, roulement, plaque, etc.). Réponds en JSON : { "type": string, "confidence": number }.',
    },
  ];
  for (const url of validUrls.slice(0, 3)) {
    const loaded = await loadImageAsBase64(url);
    if (loaded?.warning) {
      warnings.push(loaded.warning);
      continue;
    }
    if (loaded) {
      content.push({ type: 'image_url', image_url: { url: loaded.url } });
    }
  }
  if (content.length === 1) {
    return {
      detectedType: null,
      confidence: 0,
      rawResponse: '',
      warnings: [...warnings, 'Aucune image valide pour l analyse'],
    };
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.GROQ_VISION_MODEL || 'llama-3.2-90b-vision-preview',
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
        warnings: [...warnings, `groq error ${res.status}`],
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
    return {
      detectedType: null,
      confidence: 0,
      rawResponse: '',
      warnings: [...warnings, String(e)],
    };
  }
}
