import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.RELEASE_API_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { version, os, fileType, fileUrl, fileSize } = await req.json();

  if (!version || !os || !fileType || !fileUrl || fileSize === undefined) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  const installer = await prisma.desktopInstaller.create({
    data: { version, os, fileType, fileUrl, fileSize },
  });

  return NextResponse.json(installer);
}
