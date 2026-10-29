import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json();
  const candidateId = body?.candidateId;
  const rating = body?.rating;
  if (!candidateId || typeof rating !== 'number') {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
  }
  await prisma.candidateFeedback.upsert({
    where: { candidateId_userId: { candidateId, userId: user.id } },
    update: { rating },
    create: { candidateId, userId: user.id, rating },
  });
  return NextResponse.json({ success: true });
}
