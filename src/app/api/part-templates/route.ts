import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { listPartTemplates } from '@/lib/actions/part-templates';

function stripJsonFields(template: Record<string, unknown>) {
  const excluded = new Set(['dimensions', 'cadParams', 'analysisData']);
  return Object.fromEntries(Object.entries(template).filter(([key]) => !excluded.has(key)));
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const templates = await listPartTemplates();
    return NextResponse.json(templates.map(stripJsonFields));
  } catch (error) {
    console.error('[api/part-templates] Failed to fetch:', error);
    return NextResponse.json({ error: 'Failed to fetch part templates' }, { status: 500 });
  }
}
