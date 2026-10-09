import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { transitionPartStatus, TransitionError } from '@/lib/data/part-transitions';
import { PartTransitionSchema } from '@/schemas/part';
import { UserRole } from '@/generated/prisma/client';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = PartTransitionSchema.parse(body);

    const actor = {
      id: session.user.id,
      role: (session.user as { role?: string }).role as UserRole,
    };

    const updated = await transitionPartStatus(id, validated.toStatus, actor, validated.reason);

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    if (error instanceof TransitionError) {
      const statusMap: Record<TransitionError['code'], number> = {
        NOT_FOUND: 404,
        NOT_OWNER: 403,
        INVALID_TRANSITION: 409,
        FORBIDDEN: 403,
      };
      return NextResponse.json({ message: error.message }, { status: statusMap[error.code] });
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ message: 'Payload invalide' }, { status: 400 });
    }

    console.error('Error transitioning part status:', error);
    return NextResponse.json({ message: 'Erreur transition statut' }, { status: 400 });
  }
}
