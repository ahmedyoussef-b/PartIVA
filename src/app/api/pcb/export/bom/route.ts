import { NextResponse } from 'next/server';
import { generateBomFile } from '@/lib/pcb/bom-exporter';
import { requireAdmin } from '@/lib/auth-admin';

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ message }, { status });
  }
  try {
    const {
      components,
      format = 'xlsx',
      includePricing = false,
      includeFootprints = true,
    } = (await req.json()) as {
      components?: Array<{
        id: string;
        refDes?: string;
        mpn?: string;
        description?: string;
        quantity?: number;
        price?: number;
        footprint?: string;
      }>;
      format?: 'csv' | 'xlsx';
      includePricing?: boolean;
      includeFootprints?: boolean;
    };

    if (!Array.isArray(components)) {
      return NextResponse.json({ error: 'components must be an array' }, { status: 400 });
    }

    const buffer = await generateBomFile(components, { format, includePricing, includeFootprints });
    const contentType =
      format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const filename = `BOM-${new Date().toISOString().split('T')[0]}.${format}`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[BOM-EXPORT] Error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
