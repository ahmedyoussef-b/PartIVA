import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, result, action } = body;

    if (!requestId || !result) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    if (action === 'validate') {
      const part = await prisma.part.create({
        data: {
          partNumber: `CAND-${Date.now()}`,
          name: result.ingest?.description || 'Pièce reconstruite',
          description: result.ingest?.description || null,
          status: 'DRAFT',
          analysisData: result,
          printableModelUrl: result.reconstruct?.candidates?.[0]?.fileUrl || null,
        },
      });

      await prisma.reconstructionAttempt.create({
        data: {
          requestId,
          method: 'validate',
          status: 'SUCCESS',
          decision: 'VALIDATED',
          metadata: result,
        },
      });

      return NextResponse.json({ success: true, partId: part.id });
    }

    if (action === 'invalidate') {
      await prisma.reconstructionAttempt.create({
        data: {
          requestId,
          method: 'invalidate',
          status: 'FAILED',
          decision: 'REJECTED',
          metadata: result,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    console.error('Error validating:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
