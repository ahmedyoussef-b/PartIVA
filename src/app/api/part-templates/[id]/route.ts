import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { updatePartTemplate, deletePartTemplate } from '@/lib/actions/part-templates';
import { prisma } from '@/lib/prisma';

function stripJsonFields(template: Record<string, unknown>) {
  const excluded = new Set(['dimensions', 'cadParams', 'analysisData']);
  return Object.fromEntries(Object.entries(template).filter(([key]) => !excluded.has(key)));
}

async function findTemplateById(id: string) {
  return prisma.partTemplate.findUnique({ where: { id } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const template = await findTemplateById(id);
    if (!template) {
      return NextResponse.json({ message: 'Template non trouvé' }, { status: 404 });
    }
    return NextResponse.json(stripJsonFields(template));
  } catch (error) {
    console.error('[api/part-templates/[id]] GET failed:', error);
    return NextResponse.json({ error: 'Failed to fetch part template' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const existing = await findTemplateById(id);
    if (!existing) {
      return NextResponse.json({ message: 'Template non trouvé' }, { status: 404 });
    }

    const body = await req.json();
    const result = await updatePartTemplate({ id, ...body });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(stripJsonFields(result.data));
  } catch (error) {
    console.error('[api/part-templates/[id]] PUT failed:', error);
    return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const existing = await findTemplateById(id);
    if (!existing) {
      return NextResponse.json({ message: 'Template non trouvé' }, { status: 404 });
    }

    const result = await deletePartTemplate(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[api/part-templates/[id]] DELETE failed:', error);
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 400 });
  }
}
