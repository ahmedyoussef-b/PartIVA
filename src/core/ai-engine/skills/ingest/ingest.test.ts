import { describe, it, expect } from 'vitest';
import { ingestInput } from './ingest';

describe('ingestInput', () => {
  it('photo seule -> photo_only, partial', async () => {
    const photo = { name: 'part.jpg', type: 'image/jpeg', size: 1024 } as File;
    const result = await ingestInput({ photos: [photo] });
    expect(result.inputType).toBe('photo_only');
    expect(result.analysisStatus).toBe('partial');
    expect(result.metadata.fileCount).toBe(1);
  });

  it('photo + dimensions -> photo_dimensions, complete', async () => {
    const photo = { name: 'part.jpg', type: 'image/jpeg', size: 2048 } as File;
    const result = await ingestInput({ photos: [photo], dimensions: { length: 10, width: 5, unit: 'cm' } });
    expect(result.inputType).toBe('photo_dimensions');
    expect(result.analysisStatus).toBe('complete');
  });

  it('fichier STEP seul -> photo_pro_file, complete', async () => {
    const cad = { name: 'part.step', type: 'application/step', size: 4096 } as File;
    const result = await ingestInput({ cadFiles: [cad] });
    expect(result.inputType).toBe('photo_pro_file');
    expect(result.analysisStatus).toBe('complete');
  });

  it('entrée invalide -> failed', async () => {
    const result = await ingestInput({ dimensions: { unit: 'm' as any } });
    expect(result.analysisStatus).toBe('failed');
  });
});
