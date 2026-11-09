import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { method, status, metadata, files, decision, notes } = body;

  const attempt = await prisma.reconstructionAttempt.create({
    data: {
      requestId: id,
      method: method || 'unknown',
      status: status || 'pending',
      metadata: metadata || {},
      files: files || [],
      decision: decision || null,
      notes: notes || null,
    },
  });

  return NextResponse.json(attempt);
}
