import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // Adjust according to your auth config

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // SECURITY: ensure ADMIN role
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session || (session.user as { role?: string })?.role !== 'ADMIN') {
          throw new Error('Non autorisé');
        }
        return {
          allowedContentTypes: [
            'application/x-msdownload', // .exe
            'application/x-msi', // .msi
            'application/octet-stream',
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MiB max
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Blob uploaded:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
