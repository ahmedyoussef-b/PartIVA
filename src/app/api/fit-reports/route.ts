import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const FitReportSchema = z.object({
  partId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const partId = searchParams.get('partId');

  if (!partId) {
    return NextResponse.json({ message: 'partId requis' }, { status: 400 });
  }

  const fitReports = await prisma.fitReport.findMany({
    where: { partId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(fitReports);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = FitReportSchema.parse(body);

    const fitReport = await prisma.fitReport.create({
      data: {
        partId: validated.partId,
        userId: session.user.id,
        rating: validated.rating,
        comment: validated.comment ?? null,
      },
    });

    return NextResponse.json(fitReport, { status: 201 });
  } catch (error) {
    console.error('Error creating fit report:', error);
    return NextResponse.json({ message: 'Erreur création fit report' }, { status: 400 });
  }
}