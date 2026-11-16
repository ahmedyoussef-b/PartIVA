import { NextResponse } from 'next/server';
import {
  detectKicadCli,
  runErc,
  runDrc,
  exportGerbers,
  exportBom,
  exportGlb,
} from '@/lib/pcb/kicad-cli-adapter';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, inputPath, outputPath } = body as {
      action: 'erc' | 'drc' | 'gerbers' | 'bom' | 'glb' | 'detect';
      inputPath?: string;
      outputPath?: string;
    };

    if (action === 'detect') {
      const cli = await detectKicadCli();
      return NextResponse.json({ available: !!cli, path: cli });
    }

    if (!inputPath) {
      return NextResponse.json({ error: 'inputPath requis' }, { status: 400 });
    }

    let result;
    switch (action) {
      case 'erc':
        result = await runErc(inputPath, outputPath ?? 'erc.json');
        break;
      case 'drc':
        result = await runDrc(inputPath, outputPath ?? 'drc.json');
        break;
      case 'gerbers':
        result = await exportGerbers(inputPath, outputPath ?? './gerbers');
        break;
      case 'bom':
        result = await exportBom(inputPath, outputPath ?? 'bom.csv');
        break;
      case 'glb':
        result = await exportGlb(inputPath, outputPath ?? 'board.glb');
        break;
      default:
        return NextResponse.json({ error: 'action inconnue' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
