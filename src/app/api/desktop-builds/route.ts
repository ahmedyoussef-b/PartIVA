import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { resolve, join } from 'path';
import { createReadStream } from 'fs';
import crypto from 'crypto';
import { requireAdmin } from '@/lib/auth-admin';

interface DesktopBuild {
  id: string;
  version: string;
  os: 'windows' | 'macos' | 'linux' | 'unknown';
  arch: 'x86_64' | 'arm64' | 'unknown';
  format: 'exe' | 'msi' | 'dmg' | 'AppImage' | 'zip' | 'unknown';
  filename: string;
  size: number;
  downloadUrl: string;
  checksum?: string;
  publishedAt?: string;
  changelog?: string;
}

function detectInfo(filename: string) {
  const name = filename.toLowerCase();
  let os: DesktopBuild['os'] = 'unknown';
  if (name.includes('win') || name.endsWith('.exe') || name.endsWith('.msi')) os = 'windows';
  else if (name.includes('mac') || name.endsWith('.dmg')) os = 'macos';
  else if (name.includes('linux') || name.endsWith('.appimage')) os = 'linux';

  let arch: DesktopBuild['arch'] = 'x86_64';
  if (name.includes('arm64') || name.includes('aarch64')) arch = 'arm64';

  let format: DesktopBuild['format'] = 'unknown';
  if (name.endsWith('.exe')) format = 'exe';
  else if (name.endsWith('.msi')) format = 'msi';
  else if (name.endsWith('.dmg')) format = 'dmg';
  else if (name.endsWith('.appimage')) format = 'AppImage';
  else if (name.endsWith('.zip')) format = 'zip';

  return { os, arch, format };
}

function extractVersion(filename: string) {
  const match = filename.match(/(\d+\.\d+\.\d+(?:-[\w.]+)?)/);
  return match ? match[1] : '0.0.0';
}

async function computeSha256(filePath: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolvePromise(hash.digest('hex')));
  });
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const buildsDir = resolve(process.cwd(), 'public', 'builds');
    const entries = await readdir(buildsDir);
    const builds: DesktopBuild[] = [];

    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const filePath = join(buildsDir, entry);
      const stats = await stat(filePath);
      if (!stats.isFile()) continue;

      const { os, arch, format } = detectInfo(entry);
      const version = extractVersion(entry);
      let checksum: string | undefined;
      try {
        checksum = await computeSha256(filePath);
      } catch {
        checksum = undefined;
      }

      builds.push({
        id: entry,
        version,
        os,
        arch,
        format,
        filename: entry,
        size: stats.size,
        downloadUrl: `/builds/${encodeURIComponent(entry)}`,
        checksum,
        publishedAt: stats.mtime.toISOString(),
      });
    }

    builds.sort((a, b) => {
      const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      if (da !== db) return db - da;
      return b.version.localeCompare(a.version);
    });

    return NextResponse.json({ builds });
  } catch (error) {
    console.error('desktop-builds list error:', error);
    return NextResponse.json({ builds: [] });
  }
}
