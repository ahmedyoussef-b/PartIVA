import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reconstructFromCad } from './reconstruct-from-cad';

const { txMock, prismaMock, revalidatePathMock } = vi.hoisted(() => {
  const txMock = {
    partTemplate: { create: vi.fn() },
    solution: { create: vi.fn() },
  };
  const prismaMock = {
    cadFile: { findUnique: vi.fn() },
    request: { findUnique: vi.fn() },
    $transaction: vi.fn(async (cb: (tx: typeof txMock) => unknown) => cb(txMock)),
  };
  return { txMock, prismaMock, revalidatePathMock: vi.fn() };
});

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

const validInput = {
  cadFileId: 'cmwc00ohg0000yofcqm3rw4sn',
  dimensions: { length: 10, width: 5, height: 2, unit: 'mm' as const },
};

const cadFile = {
  id: 'cmwc00ohg0000yofcqm3rw4sn',
  requestId: 'cmwc00ok90001yofclyno6ee5',
  name: 'piece.step',
  url: 'https://example.com/piece.step',
};

const request = {
  id: 'cmwc00ok90001yofclyno6ee5',
  partDescription: 'Pièce test',
  suspectedMaterial: 'Acier',
};

describe('reconstructFromCad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refuse un cadFileId invalide', async () => {
    const res = await reconstructFromCad({
      ...validInput,
      cadFileId: 'bad-id',
    } as unknown as Parameters<typeof reconstructFromCad>[0]);
    expect(res).toEqual({ success: false, error: 'Données invalides' });
  });

  it('refuse des dimensions vides', async () => {
    const res = await reconstructFromCad({
      ...validInput,
      dimensions: { unit: 'mm' },
    } as unknown as Parameters<typeof reconstructFromCad>[0]);
    expect(res).toEqual({ success: false, error: 'Données invalides' });
  });

  it('refuse un fichier CAO introuvable', async () => {
    prismaMock.cadFile.findUnique.mockResolvedValue(null);
    const res = await reconstructFromCad(validInput);
    expect(res).toEqual({ success: false, error: 'Fichier CAO introuvable' });
  });

  it('refuse un fichier CAO non lié à une demande', async () => {
    prismaMock.cadFile.findUnique.mockResolvedValue({ ...cadFile, requestId: null });
    const res = await reconstructFromCad(validInput);
    expect(res).toEqual({ success: false, error: "Ce fichier CAO n'est lié à aucune demande" });
  });

  it('refuse un format non supporté', async () => {
    prismaMock.cadFile.findUnique.mockResolvedValue({
      ...cadFile,
      url: 'https://example.com/file.txt',
    });
    const res = await reconstructFromCad(validInput);
    expect(res).toEqual({ success: false, error: 'Format CAO non supporté' });
  });

  it('crée PartTemplate + Solution en transaction', async () => {
    prismaMock.cadFile.findUnique.mockResolvedValue(cadFile);
    prismaMock.request.findUnique.mockResolvedValue(request);
    const partTemplate = { id: 'tpl1', name: 'piece.step' };
    const solution = { id: 'sol1', method: 'IMPORT', confidence: 85 };
    txMock.partTemplate.create.mockResolvedValue(partTemplate);
    txMock.solution.create.mockResolvedValue(solution);

    const res = await reconstructFromCad(validInput);

    expect(res).toEqual({ success: true, data: { partTemplate, solution } });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.partTemplate.create).toHaveBeenCalledTimes(1);
    expect(txMock.solution.create).toHaveBeenCalledTimes(1);

    const tplArgs = txMock.partTemplate.create.mock.calls[0][0];
    expect(tplArgs.data.sourceMethod).toBe('IMPORT');
    expect(tplArgs.data.printableModelUrl).toBe(cadFile.url);
    expect(tplArgs.data.analysisData).toMatchObject({
      source: 'cad_import',
      cadFileId: cadFile.id,
    });

    const solArgs = txMock.solution.create.mock.calls[0][0];
    expect(solArgs.data.method).toBe('IMPORT');
    expect(solArgs.data.confidence).toBe(85);
    expect(solArgs.data.requestId).toBe(request.id);
    expect(solArgs.data.partTemplateId).toBe('tpl1');

    expect(revalidatePathMock).toHaveBeenCalledWith(`/admin/demandes/${request.id}`);
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/part-templates');
  });

  it('rollback si Solution échoue', async () => {
    prismaMock.cadFile.findUnique.mockResolvedValue(cadFile);
    prismaMock.request.findUnique.mockResolvedValue(request);
    txMock.partTemplate.create.mockResolvedValue({ id: 'tpl1' });
    txMock.solution.create.mockRejectedValue(new Error('boom'));
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => unknown) =>
      cb(txMock),
    );

    const res = await reconstructFromCad(validInput);

    expect(res.success).toBe(false);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
