import 'dotenv/config';
import { backfillImageEmbeddings } from '@/lib/data/part-embeddings';
import { isEmbeddingConfigured } from '@/lib/embeddings';

async function main() {
  if (!isEmbeddingConfigured()) {
    console.log('HF_API_TOKEN absent — backfill impossible (tous les embeddings resteront NULL).');
    console.log('Ceci est le comportement attendu (R3 du rapport E2-S05).');
    process.exit(0);
  }

  const result = await backfillImageEmbeddings();
  console.log('BACKFILL_RESULT:', JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('BACKFILL_ERROR:', error);
  process.exit(1);
});
