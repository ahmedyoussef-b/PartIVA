import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || (session.user as { role?: string })?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;

    const installer = await prisma.desktopInstaller.findUnique({ where: { id } });
    if (!installer) {
      return NextResponse.json({ error: 'Installateur introuvable' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.desktopInstaller.updateMany({ data: { isLatest: false } }),
      prisma.desktopInstaller.update({ where: { id }, data: { isLatest: true } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('desktop-builds publish error:', error);
    return NextResponse.json({ error: 'Publication échouée' }, { status: 500 });
  }
}
