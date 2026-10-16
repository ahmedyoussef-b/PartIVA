#!/usr/bin/env tsx
import { put } from '@vercel/blob';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help')) {
    console.log('Usage: tsx scripts/upload-desktop-installer.ts <path-to-setup.exe> <version> [notes]');
    return;
  }
  if (args.length < 2) {
    throw new Error('Version argument is required');
  }

  const filePath = resolve(args[0]!);
  const version = args[1]!;
  const notes = args[2] || '';

  if (!version || version.trim() === '') {
    throw new Error('Version cannot be empty');
  }

  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const buf = readFileSync(filePath);
  const size_bytes = buf.length;
  if (size_bytes > 500 * 1024 * 1024) {
    throw new Error('File exceeds 500MB');
  }
  const sha256 = createHash('sha256').update(buf).digest('hex');
  const filename = filePath.split(/[/\\]/).pop() || `PartIVA-Desktop-${version}-setup.exe`;
  const { url: blob_url } = await put(`desktop-installers/v${version}/${filename}`, buf, {
    access: 'public',
    addRandomSuffix: false,
  });
  const releasesPath = resolve('docs/desktop-releases.json');
  const json = JSON.parse(readFileSync(releasesPath, 'utf8'));
  const entry = {
    version,
    filename,
    blob_url,
    size_bytes,
    sha256,
    released_at: new Date().toISOString(),
    notes,
    os: 'windows',
    arch: 'x64',
    bundle_type: 'nsis',
  };
  json.releases.unshift(entry);
  writeFileSync(releasesPath, JSON.stringify(json, null, 2), 'utf8');
  console.log('Uploaded:', blob_url);
}
main().catch((e) => { console.error(e); process.exit(1); });
