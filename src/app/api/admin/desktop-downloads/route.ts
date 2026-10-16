import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getSignedUrl } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const releasesPath = resolve('docs/desktop-releases.json');
  const json = JSON.parse(readFileSync(releasesPath, 'utf8'));
  const releases = await Promise.all((json.releases || []).map(async (r: any) => {
    let download_url = r.blob_url;
    try {
      download_url = await getSignedUrl(r.blob_url, { expiresIn: 3600 });
    } catch {
      download_url = r.blob_url;
    }
    return {
      version: r.version,
      filename: r.filename,
      download_url,
      size_bytes: r.size_bytes,
      sha256: r.sha256,
      released_at: r.released_at,
      notes: r.notes,
    };
  }));
  return NextResponse.json({ releases });
}
