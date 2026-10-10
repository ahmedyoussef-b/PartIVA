const HF_API_URL = process.env.HF_API_URL ?? 'https://api-inference.huggingface.co/models';

const HF_MODEL = process.env.HF_EMBEDDING_MODEL ?? 'sentence-transformers/clip-ViT-B-32';

const HF_DIMENSION = 768;

export class EmbeddingError extends Error {
  constructor(
    message: string,
    public code: 'MISSING_TOKEN' | 'FETCH_FAILED' | 'INVALID_RESPONSE',
  ) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

export function getEmbeddingDimension(): number {
  return HF_DIMENSION;
}

export function isEmbeddingConfigured(): boolean {
  return Boolean(process.env.HF_API_TOKEN);
}

export async function computeImageEmbedding(imageBuffer: Buffer): Promise<number[]> {
  const token = process.env.HF_API_TOKEN;
  if (!token) {
    throw new EmbeddingError('HF_API_TOKEN absent — embeddings désactivés', 'MISSING_TOKEN');
  }

  let response: Response;
  try {
    const body = new Uint8Array(imageBuffer.byteLength);
    body.set(imageBuffer);
    response = await fetch(`${HF_API_URL}/${HF_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body,
    });
  } catch (cause) {
    throw new EmbeddingError(
      `Requête HF échouée : ${cause instanceof Error ? cause.message : String(cause)}`,
      'FETCH_FAILED',
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new EmbeddingError(`HF ${response.status} : ${text.slice(0, 200)}`, 'FETCH_FAILED');
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new EmbeddingError('Réponse HF invalide (pas un tableau)', 'INVALID_RESPONSE');
  }

  const vector = payload as unknown[];
  if (!vector.every((v) => typeof v === 'number')) {
    throw new EmbeddingError('Réponse HF invalide (valeurs non numériques)', 'INVALID_RESPONSE');
  }

  return vector as number[];
}

export function formatEmbeddingSql(vector: number[]): string {
  const body = vector.map((v) => {
    if (!Number.isFinite(v)) {
      throw new EmbeddingError('Vecteur contient une valeur non finie', 'INVALID_RESPONSE');
    }
    return String(v);
  });
  return `[${body.join(',')}]`;
}
