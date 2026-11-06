import { describe, it, expect } from 'vitest';
import { exportPartToPdf } from './pdf-export';

describe('pdf-export', () => {
  it('génère un PDF avec un nom et une référence', async () => {
    const blob = await exportPartToPdf({
      name: 'Pignon POM-C',
      reference: 'PL-004812',
      manufacturer: 'Atelier Sfax',
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(500);
    expect(blob.type).toBe('application/pdf');
  });

  it('génère un PDF avec des spécifications', async () => {
    const blob = await exportPartToPdf({
      name: 'Roulement 6205',
      reference: 'SKF-6205',
      specifications: [
        { key: 'Diamètre', value: '25mm' },
        { key: 'Matière', value: 'Acier' },
      ],
    });

    expect(blob.size).toBeGreaterThan(1000);
  });
});
