import { head } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ version: string }> }
) {
  try {
    const mod = await import('../../../../../../lib/auth-admin');
    if (typeof mod.requireAdmin === 'function') {
      await mod.requireAdmin();
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { version } = await context.params;

  const releasesPath = resolve('docs/desktop-releases.json');
  const json = JSON.parse(readFileSync(releasesPath, 'utf8'));
  const release = (json.releases as unknown[]).find((r: unknown) => {
    const releaseTyped = r as { version: string };
    return releaseTyped.version === version;
  });
  if (!release) {
    return NextResponse.json({ error: 'Version introuvable' }, { status: 404 });
  }
  const releaseTyped = release as { version: string; filename: string };

  try {
    const blob = await head(`desktop-installers/v${releaseTyped.version}/${releaseTyped.filename}`);
    const blobResponse = await fetch(blob.url);
    if (!blobResponse.ok) {
      return NextResponse.json({ error: 'Erreur de téléchargement' }, { status: 500 });
    }
    return new NextResponse(blobResponse.body, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${releaseTyped.filename}"`,
        'Content-Length': String(blob.size),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Blob introuvable' }, { status: 404 });
  }
}