import { head } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import releases from '../../../../../../docs/desktop-releases.json';

export async function GET(
  request: NextRequest,
  { params }: { params: { version: string } }
) {
  try {
    const mod = await import('../../../../../../lib/auth-admin');
    if (typeof mod.requireAdmin === 'function') {
      await mod.requireAdmin();
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const release = (releases as any).releases.find((r: any) => r.version === params.version);
  if (!release) {
    return NextResponse.json({ error: 'Version introuvable' }, { status: 404 });
  }

  try {
    const blob = await head(`desktop-installers/v${release.version}/${release.filename}`);
    const blobResponse = await fetch(blob.url);
    if (!blobResponse.ok) {
      return NextResponse.json({ error: 'Erreur de téléchargement' }, { status: 500 });
    }
    return new NextResponse(blobResponse.body, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${release.filename}"`,
        'Content-Length': String(blob.size),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Blob introuvable' }, { status: 404 });
  }
}