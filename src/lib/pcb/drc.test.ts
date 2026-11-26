import { describe, expect, it } from 'vitest';
import { categorizeDrcType, parsePreExistingViolations, runDrc, type DrcReport } from './drc';

describe('catégorisation des types', () => {
  it('place les violations de composants dans Placement', () => {
    expect(categorizeDrcType('courtyards_overlap')).toBe('placement');
    expect(categorizeDrcType('solder_mask_bridge')).toBe('placement');
  });

  it('place les violations de pistes dans Routage', () => {
    expect(categorizeDrcType('clearance')).toBe('routage');
    expect(categorizeDrcType('unconnected_items')).toBe('routage');
  });

  it('place les violations de fabrication dans Fabrication', () => {
    expect(categorizeDrcType('silk_over_copper')).toBe('fabrication');
    expect(categorizeDrcType('copper_edge_clearance')).toBe('fabrication');
  });
});

describe('parsePreExistingViolations', () => {
  it('extrait le nombre de violations pré-existantes du log Freerouting', () => {
    const log =
      'Design Warning: Board has 12 pre-existing clearance violation(s) in the loaded design (before routing):';
    expect(parsePreExistingViolations(log)).toBe(12);
  });

  it('renvoie 0 si aucune information', () => {
    expect(parsePreExistingViolations('Auto-routing stage completed')).toBe(0);
  });
});

describe('runDrc — catégorisation', () => {
  it('classe les violations par origine et conserve les pré-existantes', async () => {
    const report: DrcReport = await runDrc(
      'C:/inexistant.kicad_pcb',
      undefined,
      '12 pre-existing clearance violation(s)',
    );
    // kicad-cli absent ou board absent : le rapport doit rester structuré.
    expect(report.categories).toEqual({
      placement: 0,
      routage: 0,
      fabrication: 0,
      autre: 0,
    });
    expect(report.details).toEqual([]);
    expect(report.preExisting).toBe(0);
  });
});
