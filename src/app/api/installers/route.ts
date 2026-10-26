import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session.user as { role?: string })?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await request.json();
  const { version, os, fileType, fileUrl, fileSize } = body;

  if (!version || !os || !fileType || !fileUrl || !fileSize) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  const installer = await prisma.desktopInstaller.create({
    data: { version, os, fileType, fileUrl, fileSize },
  });

  return NextResponse.json(installer);
}
