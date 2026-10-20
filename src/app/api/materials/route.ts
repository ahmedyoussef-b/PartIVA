import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { getMaterials } from '@/lib/data/materials';

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const materials = await getMaterials();
    return NextResponse.json(materials);
  } catch (error) {
    console.error('[api/materials] Failed to fetch:', error);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}
