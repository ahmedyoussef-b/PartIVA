import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await requireUser();
  const items = await prisma.searchHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json();
  const query = body?.query ?? '';
  const filters = body?.filters ?? null;
  const resultsCount = body?.resultsCount ?? 0;
  await prisma.searchHistory.create({
    data: { userId: user.id, query, filters, resultsCount },
  });
  return NextResponse.json({ success: true });
}
