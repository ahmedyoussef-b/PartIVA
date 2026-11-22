import { describe, expect, it } from 'vitest';
import { GOLDEN_CASES } from './cases';
import { scoreGoldenCase, scoreGoldenSet } from './score';

const BASE_GOLDEN = {
  id: 'g1',
  cdc: 'cdc',
  expected: {
    boardWidthMm: 100,
    boardHeightMm: 80,
    dimensionTolerancePct: 10,
    componentKinds: ['usage', 'function', 'processing', 'mechanical'],
    mustMention: ['USB'],
  },
};

function req(category: string, key: string, value: string, status = 'proposed') {
  return { category, key, value, status };
}

const PERFECT = {
  requirements: [
    req('usage', 'Usage', 'Alimentation'),
    req('function', 'Fonction', 'Convertir 5V en 3V3 avec USB'),
    req('processing', 'Traitement', 'Régulation LDO'),
    req('mechanical', 'Largeur', '100'),
    req('mechanical', 'Hauteur', '80'),
  ],
};

describe('GOLDEN_CASES', () => {
  it('contient 10 cas', () => {
    expect(GOLDEN_CASES).toHaveLength(10);
  });

  it('chaque cdc fait plus de 80 caracteres', () => {
    for (const golden of GOLDEN_CASES) {
      expect(golden.cdc.length).toBeGreaterThan(80);
    }
  });
});

describe('scoreGoldenCase', () => {
  it('1. sortie parfaitement conforme → overall 1', () => {
    const s = scoreGoldenCase(BASE_GOLDEN, PERFECT);
    expect(s.dimensionScore).toBe(1);
    expect(s.recallScore).toBe(1);
    expect(s.validityScore).toBe(1);
    expect(s.overall).toBe(1);
  });

  it('2. dimension hors tolérance → dimensionScore 0', () => {
    const s = scoreGoldenCase(BASE_GOLDEN, {
      requirements: [req('mechanical', 'Largeur', '150'), req('mechanical', 'Hauteur', '80')],
    });
    expect(s.dimensionScore).toBe(0);
    expect(s.details.dimension?.ok).toBe(false);
  });

  it('3. dimension dans la tolérance (5 % vs 10) → 1', () => {
    const s = scoreGoldenCase(BASE_GOLDEN, {
      requirements: [req('mechanical', 'Largeur', '105'), req('mechanical', 'Hauteur', '80')],
    });
    expect(s.dimensionScore).toBe(1);
  });

  it("4. dimension absente de l'attendu → dimensionScore 1", () => {
    const golden = {
      ...BASE_GOLDEN,
      expected: { ...BASE_GOLDEN.expected, boardWidthMm: undefined, boardHeightMm: undefined },
    };
    const s = scoreGoldenCase(golden, { requirements: [req('mechanical', 'Largeur', '999')] });
    expect(s.dimensionScore).toBe(1);
    expect(s.details.dimension).toBeUndefined();
  });

  it('5. kinds partiels (2 sur 4) → recallScore 0.5', () => {
    const s = scoreGoldenCase(BASE_GOLDEN, {
      requirements: [req('usage', 'Usage', 'x'), req('function', 'Fonction', 'y')],
    });
    expect(s.recallScore).toBe(0.5);
  });

  it('6. kinds en casse différente → appariés', () => {
    const s = scoreGoldenCase(BASE_GOLDEN, {
      requirements: [
        req('USAGE', 'a', '1'),
        req('Function', 'b', '2'),
        req('PROCESSING', 'c', '3'),
        req('mechanical', 'd', '4'),
      ],
    });
    expect(s.recallScore).toBe(1);
  });

  it('7. kind en trop → extraKinds, recall inchangé', () => {
    const s = scoreGoldenCase(BASE_GOLDEN, {
      requirements: [
        req('usage', 'a', '1'),
        req('function', 'b', '2'),
        req('processing', 'c', '3'),
        req('mechanical', 'd', '4'),
        req('quality', 'e', '5'),
      ],
    });
    expect(s.recallScore).toBe(1);
    expect(s.details.extraKinds).toContain('quality');
  });

  it('8. sortie vide → validity 0, recall 0, overall < 0.5', () => {
    const s = scoreGoldenCase(BASE_GOLDEN, { requirements: [] });
    expect(s.validityScore).toBe(0);
    expect(s.recallScore).toBe(0);
    expect(s.dimensionScore).toBe(0);
    expect(s.overall).toBeLessThan(0.5);
  });

  it('9. une entree invalide sur 4 → validityScore 0.75', async () => {
    const { CreateRequestSchema } = await import('@/schemas/request');
    expect(CreateRequestSchema).toBeDefined();
    const s = scoreGoldenCase(BASE_GOLDEN, {
      requirements: [
        req('usage', 'a', '1'),
        req('function', 'b', '2'),
        req('processing', 'c', '3'),
        { category: 'unknown-category', key: '', value: 42 },
      ],
    });
    expect(s.validityScore).toBe(0.75);
  });

  it('10. mustMention absent → missingMentions non vide', () => {
    const s = scoreGoldenCase(BASE_GOLDEN, { requirements: [req('usage', 'a', 'sans mot cle')] });
    expect(s.details.missingMentions).toContain('USB');
  });

  it('11. scoreGoldenSet sur 3 cas → moyenne des overall', () => {
    const { average, scores } = scoreGoldenSet([
      { golden: BASE_GOLDEN, actual: PERFECT },
      { golden: BASE_GOLDEN, actual: { requirements: [] } },
      { golden: BASE_GOLDEN, actual: PERFECT },
    ]);
    expect(scores).toHaveLength(3);
    expect(average).toBeCloseTo((1 + 0 + 1) / 3, 5);
  });

  it('12. pondérations 0.3 / 0.4 / 0.3 sur un cas mixte', () => {
    const s = scoreGoldenCase(BASE_GOLDEN, {
      requirements: [req('usage', 'a', '1'), req('function', 'b', '2')],
    });
    // dimension 0, recall 0.5, validity 1
    const expected = 0.3 * 0 + 0.4 * 0.5 + 0.3 * 1;
    expect(s.overall).toBeCloseTo(expected, 5);
  });
});
