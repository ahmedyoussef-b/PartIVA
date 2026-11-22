import { NextResponse } from 'next/server';
import { generateGerberZip } from '@/lib/pcb/gerber-exporter';
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
    const { projectId, layers } = (await req.json()) as {
      projectId?: string;
      layers?: string[];
    };

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const buffer = await generateGerberZip({ projectId, layers });
    const filename = `GERBER-${projectId}-${new Date().toISOString().split('T')[0]}.zip`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[GERBER-EXPORT] Error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
