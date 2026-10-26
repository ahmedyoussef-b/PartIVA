// New upload route using Vercel Blob – generates an upload token
import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  // Parse the JSON body as expected by @vercel/blob client
  const body = (await request.json()) as HandleUploadBody;

  try {
    // Verify admin session via Better‑Auth API helper
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || (session.user as { role?: string })?.role !== 'ADMIN') {
      throw new Error('Non autorisé');
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            'application/x-msdownload', // .exe
            'application/x-msi', // .msi
            'application/octet-stream', // generic binaries (.dmg, .AppImage, .zip)
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MiB
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Optional: persist blob metadata (url, size, checksum) in Prisma later.
        console.log('Blob uploaded:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
