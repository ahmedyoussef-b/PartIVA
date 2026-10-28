export function getGroqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY;
}

export function getCloudflareConfig() {
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    model: process.env.CLOUDFLARE_EMBEDDING_MODEL || '@cf/baai/bge-small-en-v1.5',
    dimensions: Number(process.env.CLOUDFLARE_EMBEDDING_DIMENSIONS || '384'),
  };
}
