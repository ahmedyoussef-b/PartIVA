import { describe, expect, it } from 'vitest';
import { resolveKicadFootprint, type FsAdapter } from './kicad-footprints';

const ROOT = '/kicad/footprints';

const fs: FsAdapter = {
  exists: (p) =>
    [
      `${ROOT}/Package_TO_SOT_THT.pretty/TO-220-3_Vertical.kicad_mod`,
      `${ROOT}/Package_TO_SOT_SMD.pretty/TO-263-5_TabPin3.kicad_mod`,
      `${ROOT}/Converter_DCDC.pretty/Converter_DCDC_MeanWell_NID30_THT.kicad_mod`,
    ].includes(p),
  list: (dir) => {
    if (dir === ROOT)
      return ['Package_TO_SOT_THT.pretty', 'Package_TO_SOT_SMD.pretty', 'Converter_DCDC.pretty'];
    if (dir.endsWith('Package_TO_SOT_SMD.pretty')) return ['TO-263-5_TabPin3.kicad_mod'];
    if (dir.endsWith('Package_TO_SOT_THT.pretty')) return ['TO-220-3_Vertical.kicad_mod'];
    if (dir.endsWith('Converter_DCDC.pretty'))
      return ['Converter_DCDC_MeanWell_NID30_THT.kicad_mod'];
    return [];
  },
};

describe('resolveKicadFootprint', () => {
  it('garde une empreinte existante telle quelle', () => {
    const r = resolveKicadFootprint('Package_TO_SOT_THT', 'TO-220-3_Vertical', 'U1', ROOT, fs);
    expect(r).toEqual({
      libName: 'Package_TO_SOT_THT',
      footprintName: 'TO-220-3_Vertical',
      corrected: false,
      strategy: 'exact',
      proposed: 'Package_TO_SOT_THT:TO-220-3_Vertical',
    });
  });

  it('retombe sur un fallback U quand lempreinte IA est introuvable', () => {
    const r = resolveKicadFootprint('Converter_DCDC', 'DCDC-Module_TO-220', 'U1', ROOT, fs);
    expect(r.corrected).toBe(true);
    expect(r.strategy).toBe('fallback');
    expect(r.libName).toBe('Package_TO_SOT_THT');
    expect(r.footprintName).toBe('TO-220-3_Vertical');
    expect(r.proposed).toBe('Converter_DCDC:DCDC-Module_TO-220');
  });

  it('utilise un fallback specifique au prefixe de reference', () => {
    const r = resolveKicadFootprint('Inconnu', 'Truc', 'R7', ROOT, fs);
    expect(r).toMatchObject({
      libName: 'Resistor_SMD',
      footprintName: 'R_0603_1608Metric',
      strategy: 'fallback',
    });
  });

  it('trouve une empreinte dans une autre bibliotheque', () => {
    const r = resolveKicadFootprint('MauvaiseLib', 'TO-220-3_Vertical', 'U1', ROOT, fs);
    expect(r).toMatchObject({
      libName: 'Package_TO_SOT_THT',
      corrected: false,
      strategy: 'other-lib',
    });
  });

  it('trouve une empreinte par fuzzy', () => {
    const r = resolveKicadFootprint('MauvaiseLib', 'TO-263-5', 'U1', ROOT, fs);
    expect(r).toMatchObject({ footprintName: 'TO-263-5_TabPin3', strategy: 'fuzzy' });
  });

  it('neutralise les chemins fournis par le LLM', () => {
    const seen: string[] = [];
    const spyFs: FsAdapter = {
      exists: (p) => {
        seen.push(p);
        return false;
      },
      list: () => [],
    };
    const r = resolveKicadFootprint('../../evil', '../../../etc/passwd', 'U1', ROOT, spyFs);
    expect(r.strategy).toBe('fallback');
    expect(seen.every((p) => p.startsWith(`${ROOT}/`))).toBe(true);
    expect(seen.some((p) => p.includes('..'))).toBe(false);
  });
});
