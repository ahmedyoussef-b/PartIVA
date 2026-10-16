import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export async function GET(_req: NextRequest) {
  try {
    const mod = await import('../../../lib/auth-admin');
    await mod.requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const releasesPath = resolve('docs/desktop-releases.json');
  const json = JSON.parse(readFileSync(releasesPath, 'utf8'));
  const releases = (json.releases || []).map((r: any) => ({
    version: r.version,
    filename: r.filename,
    download_url: r.blob_url,
    size_bytes: r.size_bytes,
    sha256: r.sha256,
    released_at: r.released_at,
    notes: r.notes,
  }));
  return NextResponse.json({ releases });
}