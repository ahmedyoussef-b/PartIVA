import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export async function GET() {
  try {
    const mod = await import('../../../../lib/auth-admin');
    await mod.requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const releasesPath = resolve('docs/desktop-releases.json');
  const json = JSON.parse(readFileSync(releasesPath, 'utf8'));
  const releases = (json.releases || []).map((r: unknown) => {
    const release = r as {
      version: string;
      filename: string;
      size_bytes: number;
      sha256: string;
      released_at: string;
      notes: string;
    };
    return {
      version: release.version,
      filename: release.filename,
      size_bytes: release.size_bytes,
      sha256: release.sha256,
      released_at: release.released_at,
      notes: release.notes,
      download_url: `/api/admin/desktop-downloads/${release.version}/download`,
    };
  });
  return NextResponse.json({ releases });
}
