import { describe, expect, it } from 'vitest';
import { computePriceTotal, type CatalogPrice, type PriceLine } from './price-total';

const L1: PriceLine = { reference: 'R1', catalogId: 'c1' };
const L2: PriceLine = { reference: 'C1', catalogId: 'c2' };
const P1: CatalogPrice = { catalogId: 'c1', unitPrice: 0.5, currency: 'EUR' };
const P2: CatalogPrice = { catalogId: 'c2', unitPrice: 2.5, currency: 'EUR' };

describe('computePriceTotal', () => {
  it('1. 2 lignes avec prix → total correct', () => {
    const r = computePriceTotal([L1, L2], [P1, P2]);
    expect(r.total).toBe(3);
    expect(r.pricedCount).toBe(2);
    expect(r.lineCount).toBe(2);
    expect(r.unpriced).toEqual([]);
  });

  it('2. quantity 3 → prix × 3', () => {
    const r = computePriceTotal([{ reference: 'R1', catalogId: 'c1', quantity: 3 }], [P1]);
    expect(r.total).toBe(1.5);
  });

  it('3. ligne sans catalogId → unpriced', () => {
    const r = computePriceTotal([{ reference: 'R1', catalogId: null }], [P1]);
    expect(r.total).toBe(0);
    expect(r.unpriced).toEqual(['R1']);
  });

  it('4. prix null → unpriced', () => {
    const r = computePriceTotal([L1], [{ catalogId: 'c1', unitPrice: null }]);
    expect(r.unpriced).toEqual(['R1']);
  });

  it('5. prix 0 ou négatif → unpriced', () => {
    expect(computePriceTotal([L1], [{ catalogId: 'c1', unitPrice: 0 }]).unpriced).toEqual(['R1']);
    expect(computePriceTotal([L1], [{ catalogId: 'c1', unitPrice: -1 }]).unpriced).toEqual(['R1']);
  });

  it('6. quantity invalide (0 / NaN) → traitée comme 1', () => {
    expect(computePriceTotal([{ reference: 'R1', catalogId: 'c1', quantity: 0 }], [P1]).total).toBe(
      0.5,
    );
    expect(
      computePriceTotal([{ reference: 'R1', catalogId: 'c1', quantity: NaN }], [P1]).total,
    ).toBe(0.5);
  });

  it('7. doublon de catalogId → premier retenu', () => {
    const r = computePriceTotal(
      [L1],
      [
        { catalogId: 'c1', unitPrice: 0.5 },
        { catalogId: 'c1', unitPrice: 9.9 },
      ],
    );
    expect(r.total).toBe(0.5);
  });

  it('8. liste vide → total 0, lineCount 0, unpriced vide', () => {
    const r = computePriceTotal([], [P1]);
    expect(r.total).toBe(0);
    expect(r.lineCount).toBe(0);
    expect(r.pricedCount).toBe(0);
    expect(r.unpriced).toEqual([]);
  });

  it('9. arrondi : 3 × 0.1 → 0.3', () => {
    const r = computePriceTotal(
      [{ reference: 'R1', catalogId: 'c1', quantity: 3 }],
      [{ catalogId: 'c1', unitPrice: 0.1 }],
    );
    expect(r.total).toBe(0.3);
  });

  it('devise : option > première rencontrée > EUR', () => {
    expect(
      computePriceTotal([], [{ catalogId: 'c1', unitPrice: 1, currency: 'USD' }]).currency,
    ).toBe('USD');
    expect(
      computePriceTotal([], [{ catalogId: 'c1', unitPrice: 1 }], { currency: 'GBP' }).currency,
    ).toBe('GBP');
    expect(computePriceTotal([], [{ catalogId: 'c1', unitPrice: 1 }]).currency).toBe('EUR');
  });
});
