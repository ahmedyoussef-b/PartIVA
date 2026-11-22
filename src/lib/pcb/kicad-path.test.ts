import { describe, expect, it } from 'vitest';
import { validateKicadFilePath } from './kicad-path';

describe('validateKicadFilePath', () => {
  it('accepte un chemin de projet stable', () => {
    expect(
      validateKicadFilePath('C:\\Users\\pc\\Documents\\PartIVA\\projets\\carte.kicad_pcb'),
    ).toEqual({
      ok: true,
    });
  });

  it.each([
    'C:\\Users\\pc\\AppData\\Local\\Temp\\opencode\\e2e\\carte-test.kicad_pcb',
    '%TEMP%\\carte.kicad_pcb',
    '/tmp/carte.kicad_pcb',
    'C:\\Temp\\carte.kicad_pcb',
  ])('refuse le chemin temporaire %s', (value) => {
    expect(validateKicadFilePath(value)).toEqual({
      ok: false,
      error: 'Le chemin du projet ne peut pas être dans un dossier temporaire.',
    });
  });

  it('refuse une extension invalide', () => {
    expect(validateKicadFilePath('C:\\projets\\carte.kicad_sch').ok).toBe(false);
  });

  it('refuse un chemin vide', () => {
    expect(validateKicadFilePath('   ').ok).toBe(false);
  });
});
