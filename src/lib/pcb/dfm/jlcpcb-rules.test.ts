import { describe, expect, it } from 'vitest';
import { JLCPCB_RULES, validateDfm } from './jlcpcb-rules';

describe('profil JLCPCB', () => {
  it('définit les seuils attendus', () => {
    expect(JLCPCB_RULES.minTrackWidthMm).toBe(0.1);
    expect(JLCPCB_RULES.minClearanceMm).toBe(0.1);
    expect(JLCPCB_RULES.minDrillMm).toBe(0.3);
    expect(JLCPCB_RULES.minAnnularRingMm).toBe(0.13);
    expect(JLCPCB_RULES.copperToEdgeMm).toBe(0.5);
  });
});

describe('validateDfm', () => {
  it('accepte un rapport sans violation', () => {
    expect(validateDfm({ ok: true, violations: 0, details: [] }).ok).toBe(true);
  });

  it('signale une largeur de piste trop faible', () => {
    const result = validateDfm({
      violations: 1,
      details: [{ type: 'track_width', severity: 'error', description: 'Piste trop fine' }],
    });
    expect(result.ok).toBe(false);
    expect(result.violations[0]?.suggestion).toContain('0.1 mm');
  });

  it('signale un dégagement cuivre-bord insuffisant', () => {
    const result = validateDfm({
      violations: 1,
      details: [
        { type: 'copper_edge_clearance', severity: 'error', description: 'Cuivre proche du bord' },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.violations[0]?.suggestion).toContain('0.5 mm');
  });

  it('ignore les violations de routage sans seuil fabricant', () => {
    const result = validateDfm({
      violations: 1,
      details: [{ type: 'unconnected_items', severity: 'error', description: 'Non connecté' }],
    });
    expect(result.ok).toBe(true);
  });
});
