import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { resolve, join } from 'path';
import crypto from 'crypto';
import { requireAdmin } from '@/lib/auth-admin';

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const allowedExt = ['.exe', '.msi', '.dmg', '.AppImage', '.zip'];
    const filename = file.name;
    if (!allowedExt.some((ext) => filename.toLowerCase().endsWith(ext))) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const buildsDir = resolve(process.cwd(), 'public', 'builds');
    await mkdir(buildsDir, { recursive: true });
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = join(buildsDir, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    return NextResponse.json({
      success: true,
      filename: safeName,
      size: buffer.length,
      checksum: hash,
      downloadUrl: `/builds/${encodeURIComponent(safeName)}`,
    });
  } catch (error) {
    console.error('desktop-builds upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
