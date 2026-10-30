import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.searchHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error('[search/history] GET error:', e);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const query = body?.query ?? '';
    const filters = body?.filters ?? null;
    const resultsCount = body?.resultsCount ?? 0;
    await prisma.searchHistory.create({
      data: { userId: user.id, query, filters, resultsCount },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[search/history] POST error:', e);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
