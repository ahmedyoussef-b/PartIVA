import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { REQUIRED_SPEC_KEYS } from '@/lib/part-required-specs';

const DEFAULT_UNITS: Record<string, string> = {
  diameter_ext: 'mm',
  diameter_int: 'mm',
  width: 'mm',
  weight: 'g',
  module: 'mm',
  teeth: '',
  bore: 'mm',
  contact_angle: '°',
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }

  const { id } = await params;
  const part = await prisma.part.findUnique({
    where: { id },
    select: { id: true, clientId: true },
  });

  if (!part) {
    return NextResponse.json({ message: 'Pièce non trouvée' }, { status: 404 });
  }

  const actorRole = (session.user as { role?: string }).role;
  if (actorRole === 'USER' && part.clientId !== session.user.id) {
    return NextResponse.json({ message: 'Pièce non détenue par cet utilisateur' }, { status: 403 });
  }

  const specifications = await prisma.partSpecification.findMany({
    where: { partId: id },
    select: { key: true },
  });

  const presentKeys = new Set(specifications.map((s) => s.key));
  const suggestions = REQUIRED_SPEC_KEYS.filter((key) => !presentKeys.has(key)).map((key) => ({
    key,
    unit: DEFAULT_UNITS[key] ?? '',
  }));

  return NextResponse.json({ partId: id, suggestions });
}
