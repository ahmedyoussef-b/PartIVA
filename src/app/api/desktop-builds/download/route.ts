export const dynamic = 'force-static';

import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const file = searchParams.get('file');
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    // Prevent path traversal
    const safeName = file.replace(/\.\./g, '').replace(/[\/\\]/g, '');
    const filePath = join(resolve(process.cwd(), 'public', 'builds'), safeName);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const buffer = readFileSync(filePath);
    const ext = safeName.toLowerCase().split('.').pop();
    let contentType = 'application/octet-stream';
    if (ext === 'exe') contentType = 'application/vnd.microsoft.portable-executable';
    else if (ext === 'msi') contentType = 'application/x-msi';
    else if (ext === 'dmg') contentType = 'application/x-apple-diskimage';
    else if (ext === 'appimage') contentType = 'application/octet-stream';
    else if (ext === 'zip') contentType = 'application/zip';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('desktop-builds download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}

