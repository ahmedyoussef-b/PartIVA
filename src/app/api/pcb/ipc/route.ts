import { NextResponse } from 'next/server';
import { detectKicadIpc, getKicadProject, updateKicadProject } from '@/lib/pcb/kicad-ipc-adapter';
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
    const body = await req.json();
    const { action, socketPath, project } = body as {
      action: 'detect' | 'getVersion' | 'getProject' | 'updateProject';
      socketPath?: string;
      project?: { name: string; path: string; components: number; nets: number };
    };

    if (action === 'detect') {
      const info = await detectKicadIpc();
      return NextResponse.json(info);
    }

    if (action === 'getVersion') {
      const info = await detectKicadIpc();
      return NextResponse.json({ version: info.version, available: info.available });
    }

    if (!socketPath) {
      return NextResponse.json({ error: 'socketPath requis' }, { status: 400 });
    }

    if (action === 'getProject') {
      const p = await getKicadProject(socketPath);
      return NextResponse.json({ project: p });
    }

    if (action === 'updateProject') {
      if (!project) {
        return NextResponse.json({ error: 'project requis' }, { status: 400 });
      }
      const ok = await updateKicadProject(socketPath, project);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: 'action inconnue' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
