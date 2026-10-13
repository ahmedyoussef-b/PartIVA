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
  // Lightweight Embeddings (HF Space) ne nécessite aucun token.
  if (isLightweight()) {
    return Boolean(HF_API_URL);
  }
  return Boolean(process.env.HF_API_TOKEN);
}

type Provider = 'lightweight' | 'deepinfra' | 'huggingface';

function detectProvider(): Provider {
  if (isLightweight()) {
    return 'lightweight';
  }
  if (HF_API_URL.includes('deepinfra.com')) {
    return 'deepinfra';
  }
  return 'huggingface';
}

function isLightweight(): boolean {
  return HF_API_URL.includes('hf.space');
}

export async function computeImageEmbedding(image: string | Buffer): Promise<number[]> {
  const token = process.env.HF_API_TOKEN;
  const provider = detectProvider();

  if (provider !== 'lightweight' && !token) {
    throw new EmbeddingError('HF_API_TOKEN absent — embeddings désactivés', 'MISSING_TOKEN');
  }

  let response: Response;
  try {
    if (provider === 'lightweight') {
      // Lightweight Embeddings (HF Space) : POST {base}/v1/embeddings
      // body { model, input: <image URL ou data-url base64> },
      // réponse OpenAI-compat { data: [{ embedding: [...] }] }.
      // Pas de token requis.
      const input = typeof image === 'string' ? image : bufferToDataUrl(image);
      response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: HF_MODEL, input }),
      });
    } else if (provider === 'deepinfra') {
      // DeepInfra : POST {base}/{model}, body { input: <data-url base64> },
      // réponse { embeddings: [[...]] }.
      const imageBuffer = typeof image === 'string' ? await downloadImage(image) : image;
      const dataUrl = bufferToDataUrl(imageBuffer);
      response = await fetch(`${HF_API_URL}/${HF_MODEL}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: dataUrl }),
      });
    } else {
      // HuggingFace : body binaire (octet-stream), réponse [0.1, 0.2, ...].
      const imageBuffer = typeof image === 'string' ? await downloadImage(image) : image;
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
    }
  } catch (cause) {
    throw new EmbeddingError(
      `Requête ${provider} échouée : ${cause instanceof Error ? cause.message : String(cause)}`,
      'FETCH_FAILED',
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new EmbeddingError(
      `${provider} ${response.status} : ${text.slice(0, 200)}`,
      'FETCH_FAILED',
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (provider === 'lightweight') {
    // OpenAI-compat : { data: [{ embedding: [...] }] }
    const obj = payload as { data?: Array<{ embedding?: number[] }> } | null;
    const vector = obj?.data?.[0]?.embedding;
    if (
      !Array.isArray(vector) ||
      vector.length === 0 ||
      !vector.every((v) => typeof v === 'number')
    ) {
      throw new EmbeddingError(
        'Réponse Lightweight invalide (pas de data[0].embedding)',
        'INVALID_RESPONSE',
      );
    }
    return vector;
  }

  if (provider === 'deepinfra') {
    // { embeddings: [[...]] } ou { embedding: [...] }
    const obj = payload as { embeddings?: number[][]; embedding?: number[] } | null;
    const vector = obj?.embeddings?.[0] ?? obj?.embedding;
    if (
      !Array.isArray(vector) ||
      vector.length === 0 ||
      !vector.every((v) => typeof v === 'number')
    ) {
      throw new EmbeddingError(
        'Réponse DeepInfra invalide (pas de embeddings)',
        'INVALID_RESPONSE',
      );
    }
    return vector;
  }

  // HuggingFace : [0.1, 0.2, ...] ou [[0.1, 0.2, ...]]
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new EmbeddingError('Réponse HF invalide (pas un tableau)', 'INVALID_RESPONSE');
  }
  const vector = (Array.isArray(payload[0]) ? (payload as number[][])[0] : payload) as number[];
  if (!vector.every((v) => typeof v === 'number')) {
    throw new EmbeddingError('Réponse HF invalide (valeurs non numériques)', 'INVALID_RESPONSE');
  }
  return vector;
}

async function downloadImage(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function bufferToDataUrl(imageBuffer: Buffer): string {
  return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
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
