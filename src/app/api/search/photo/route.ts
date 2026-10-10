import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { computeImageEmbedding, EmbeddingError } from '@/lib/embeddings';
import { searchPartsByPhoto } from '@/lib/data/part-embeddings';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const PhotoSearchRequestSchema = z.object({
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  data: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).nullish().default(20),
});

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const validated = PhotoSearchRequestSchema.parse(body);

    const buffer = Buffer.from(validated.data, 'base64');
    if (buffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { message: `Image trop volumineuse (max ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024} Mo)` },
        { status: 400 },
      );
    }

    const isUser = session.user.role === 'USER';
    const clientId = isUser ? session.user.id : undefined;

    const queryEmbedding = await computeImageEmbedding(buffer);
    const results = await searchPartsByPhoto(queryEmbedding, {
      clientId,
      limit: validated.limit ?? undefined,
    });

    return NextResponse.json({
      mode: 'photo',
      count: results.length,
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Payload invalide' }, { status: 400 });
    }

    if (error instanceof EmbeddingError) {
      if (error.code === 'MISSING_TOKEN') {
        return NextResponse.json(
          { message: 'Recherche par photo indisponible (HF_API_TOKEN absent)' },
          { status: 503 },
        );
      }
      return NextResponse.json({ message: `Erreur embedding : ${error.message}` }, { status: 502 });
    }

    console.error('Error searching parts by photo:', error);
    return NextResponse.json({ message: 'Erreur recherche par photo' }, { status: 400 });
  }
}
