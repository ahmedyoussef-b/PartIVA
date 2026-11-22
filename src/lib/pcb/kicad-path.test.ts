import { describe, expect, it } from 'vitest';
import { normalizeBoardPath, validateKicadFilePath } from './kicad-path';

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

describe('normalizeBoardPath', () => {
  it('convertit un chemin Windows en forme absolue POSIX', () => {
    expect(normalizeBoardPath('C:\\Users\\pc\\Documents\\PartIVA\\projets\\carte.kicad_pcb')).toBe(
      '/c/Users/pc/Documents/PartIVA/projets/carte.kicad_pcb',
    );
  });

  it('convertit C:/ vers /c/ et normalise les backslashes', () => {
    expect(normalizeBoardPath('C:/Program Files/KiCad/10.0/share/kicad/demos/x.kicad_pcb')).toBe(
      '/c/Program Files/KiCad/10.0/share/kicad/demos/x.kicad_pcb',
    );
    expect(normalizeBoardPath('C:\\tmp\\board.kicad_pcb')).toBe('/c/tmp/board.kicad_pcb');
  });

  it('garde un chemin POSIX absolu tel quel', () => {
    expect(normalizeBoardPath('/tmp/carte.kicad_pcb')).toBe('/tmp/carte.kicad_pcb');
  });

  it('retire les espaces superflus en debut et fin', () => {
    expect(normalizeBoardPath('  /tmp/carte.kicad_pcb  ')).toBe('/tmp/carte.kicad_pcb');
  });
});
