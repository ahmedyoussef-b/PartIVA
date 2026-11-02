import { z } from 'zod';
import { callGroq } from '@/lib/ai/groq-client';
import { VisionInput, VisionResult } from './types';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 3;

const visionResponseSchema = z.object({
  type: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

async function loadImageAsBase64(url: string): Promise<{ url: string; warning?: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      return { url, warning: 'Image inaccessible' };
    }
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
      return { url, warning: 'Image trop volumineuse' };
    }
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return { url: `data:${contentType};base64,${base64}` };
  } catch {
    return { url, warning: 'Echec de chargement de l image' };
  }
}

export async function detectPartType(input: VisionInput): Promise<VisionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  const warnings: string[] = [];
  const structuredWarnings: { code: string; message: string; stage?: string }[] = [];
  if (!apiKey || input.photoUrls.length === 0) {
    return {
      detectedType: null,
      confidence: 0,
      rawResponse: '',
      warnings: [!apiKey ? 'Cle API Groq manquante' : 'Aucune photo transmise'],
    };
  }
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
  if (validUrls.length > MAX_IMAGES) {
    structuredWarnings.push({ code: 'VISION_TOO_MANY_IMAGES', message: 'Trop d images transmises (maximum 3).', stage: 'vision' });
    warnings.push('VISION_TOO_MANY_IMAGES');
    return { detectedType: null, confidence: 0, rawResponse: '', warnings, structuredWarnings: structuredWarnings as never };
  }
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: 'text',
      text: 'Tu es un expert en pieces mecaniques. Analyse l image et identifie le type de piece. Reponds en JSON : { "type": string, "confidence": number }.',
    },
  ];
  for (const url of validUrls.slice(0, 3)) {
    const loaded = await loadImageAsBase64(url);
    if (loaded?.warning) {
      warnings.push(loaded.warning);
      structuredWarnings.push({ code: 'VISION_DOWNLOAD_FAILED', message: 'Echec du telechargement de l image.', stage: 'vision' });
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
      structuredWarnings: structuredWarnings as never,
    };
  }
  try {
    const messages = [{ role: 'user', content }] as never;
    const { content: raw } = await callGroq(messages, apiKey, {
      model: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b',
      temperature: 0.2,
      maxTokens: 256,
    });
    let detectedType: string | null = null;
    let confidence = 0;
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = visionResponseSchema.parse(JSON.parse(m[0]));
        detectedType = parsed.type;
        confidence = parsed.confidence;
      } else {
        throw new Error('no json');
      }
    } catch {
      structuredWarnings.push({ code: 'VISION_PARSE_FAILED', message: 'Reponse du modele IA non exploitable.', stage: 'vision' });
      warnings.push('VISION_PARSE_FAILED');
    }
    return { detectedType, confidence, rawResponse: raw, warnings, structuredWarnings: structuredWarnings as never };
  } catch (e: any) {
    const code = e?.code ?? 'GROQ_HTTP_ERROR';
    warnings.push(code);
    return {
      detectedType: null,
      confidence: 0,
      rawResponse: '',
      warnings,
      structuredWarnings: [...structuredWarnings, { code, message: code, stage: 'vision' }] as never,
    };
  }
}
