import { NextResponse } from 'next/server';
import { detectKicadIpc, getKicadProject, updateKicadProject } from '@/lib/pcb/kicad-ipc-adapter';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, socketPath, project } = body as {
      action: 'detect' | 'getProject' | 'updateProject';
      socketPath?: string;
      project?: { name: string; path: string; components: number; nets: number };
    };

    if (action === 'detect') {
      const info = await detectKicadIpc();
      return NextResponse.json(info);
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
