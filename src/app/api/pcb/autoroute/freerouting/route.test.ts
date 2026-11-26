import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  findProject: vi.fn(),
  findNets: vi.fn(),
  assignBoardNets: vi.fn(),
  exportDsn: vi.fn(),
  importSes: vi.fn(),
  runDrc: vi.fn(),
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
  execFileAsync: vi.fn(),
}));
const {
  findProject,
  findNets,
  assignBoardNets,
  exportDsn,
  importSes,
  runDrc,
  existsSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  execFileAsync,
} = m;

vi.mock('@/lib/auth-admin', () => ({ requireAdmin: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pcbProject: { findUnique: (...a: unknown[]) => findProject(...a) },
    pcbNet: { findMany: (...a: unknown[]) => findNets(...a) },
  },
}));
vi.mock('@/lib/pcb/kicad-bridge', () => ({
  assignBoardNets: (...a: unknown[]) => assignBoardNets(...a),
  exportDsn: (...a: unknown[]) => exportDsn(...a),
  importSes: (...a: unknown[]) => importSes(...a),
}));
vi.mock('@/lib/pcb/drc', () => ({ runDrc: (...a: unknown[]) => runDrc(...a) }));
vi.mock('node:fs', () => ({
  existsSync: (...a: unknown[]) => existsSync(...a),
  readFileSync: (...a: unknown[]) => readFileSync(...a),
  writeFileSync: (...a: unknown[]) => writeFileSync(...a),
  unlinkSync: (...a: unknown[]) => unlinkSync(...a),
}));
vi.mock('node:util', () => ({ promisify: () => m.execFileAsync }));

import { requireAdmin } from '@/lib/auth-admin';
import { POST } from './route';

const BOARD = 'C:/data/carte-test.kicad_pcb';

function request() {
  return new Request('http://localhost/api/pcb/autoroute/freerouting', {
    method: 'POST',
    body: JSON.stringify({ projectId: 'proj-1' }),
  });
}

describe('POST /api/pcb/autoroute/freerouting — chaîne DSN → SES → DRC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({ role: 'ADMIN' } as never);
    findProject.mockResolvedValue({ id: 'proj-1', kicadFilePath: BOARD });
    findNets.mockResolvedValue([{ name: 'GND', pins: ['U1.1', 'C1.1'] }]);
    existsSync.mockReturnValue(true);
    assignBoardNets.mockResolvedValue({ ok: true, assignedPads: 2, missingPins: 0 });
    exportDsn.mockResolvedValue({ ok: true, bytes: 100 });
    importSes.mockResolvedValue({ ok: true, tracks: 4 });
    runDrc.mockResolvedValue({ ok: true, violations: 3, unconnected: 1 });
    execFileAsync.mockResolvedValue({ stdout: '', stderr: '' });
    readFileSync.mockImplementation((p: string) => {
      if (String(p).endsWith('.dsn')) return '(pcb (component (place R1 (PN "10k\u03a9"))))';
      if (String(p).endsWith('.ses')) return '(session (routes (wire (path F.Cu 0 0 1 1))))';
      return '{}';
    });
    writeFileSync.mockImplementation(() => {});
    unlinkSync.mockImplementation(() => {});
    vi.stubEnv('FREEROUTING_JAR', 'C:/tools/freerouting.jar');
  });

  it('refuse un projet sans net exploitable', async () => {
    findNets.mockResolvedValue([]);
    const res = await POST(request());
    expect(res.status).toBe(400);
    expect(exportDsn).not.toHaveBeenCalled();
  });

  it('refuse si aucun pad n’est assigné (échec silencieux évité)', async () => {
    assignBoardNets.mockResolvedValue({ ok: true, assignedPads: 0, missingPins: 4 });
    const res = await POST(request());
    expect(res.status).toBe(422);
    const body = (await res.json()) as { missingPins: number };
    expect(body.missingPins).toBe(4);
    expect(exportDsn).not.toHaveBeenCalled();
  });

  it('assainit les caractères non-ANSI du DSN avant Freerouting', async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);
    const dsnWrite = writeFileSync.mock.calls.find((c) => String(c[0]).endsWith('.dsn'));
    expect(dsnWrite?.[1]).toContain('10kOhm');
    expect(dsnWrite?.[1]).not.toContain('\u03a9');
  });

  it('refuse un SES sans aucune piste', async () => {
    readFileSync.mockImplementation((p: string) => {
      if (String(p).endsWith('.dsn')) return '(pcb)';
      if (String(p).endsWith('.ses')) return '(session (routes))';
      return '{}';
    });
    const res = await POST(request());
    expect(res.status).toBe(502);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('SES_EMPTY');
    expect(importSes).not.toHaveBeenCalled();
  });

  it('retourne le rapport DRC après import du SES', async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      tracks: number;
      wires: number;
      drc: { violations: number; unconnected: number };
    };
    expect(body.ok).toBe(true);
    expect(body.tracks).toBe(4);
    expect(body.wires).toBe(1);
    expect(body.drc.violations).toBe(3);
    expect(body.drc.unconnected).toBe(1);
  });
});
