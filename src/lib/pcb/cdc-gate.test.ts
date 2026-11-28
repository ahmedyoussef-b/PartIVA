import { describe, expect, it } from 'vitest';
import { cdcCategoryLabel, evaluateCdcCompleteness, evaluateCdcGate } from './cdc-gate';

const confirmed = (category: string, key = keyFor(category)) => ({
  category,
  key,
  value: 'valeur',
  status: 'confirmed',
});

function keyFor(category: string): string {
  return `${category}_key`;
}

const complete = ['usage', 'function', 'processing', 'mechanical', 'manufacturing', 'quality'].map(
  (c) => confirmed(c),
);

describe('cdcCategoryLabel', () => {
  it('affiche les catégories en français', () => {
    expect(cdcCategoryLabel('manufacturing')).toBe('Fabrication');
    expect(cdcCategoryLabel('quality')).toBe('Qualité');
    expect(cdcCategoryLabel('autre')).toBe('autre');
  });
});

describe('evaluateCdcCompleteness', () => {
  it('exige les catégories requises et confirmation de chaque champ', () => {
    expect(evaluateCdcCompleteness(complete)).toEqual({ ready: true, missing: [] });
    const partial = complete.slice(0, 4);
    expect(evaluateCdcCompleteness(partial).missing).toContain('manufacturing');
    expect(evaluateCdcCompleteness(partial).ready).toBe(false);
  });

  it('tolère l’absence de la catégorie Qualité (optionnelle)', () => {
    expect(evaluateCdcCompleteness(complete.slice(0, -1))).toEqual({ ready: true, missing: [] });
  });

  it('signale les champs non confirmés', () => {
    const withProposal = complete.map((r, i) => (i === 0 ? { ...r, status: 'proposed' } : r));
    const result = evaluateCdcCompleteness(withProposal);
    expect(result.ready).toBe(false);
    expect(result.missing.some((m) => m.includes('confirmer'))).toBe(true);
  });

  it('signale une valeur vide', () => {
    const withEmpty = complete.map((r, i) => (i === 0 ? { ...r, value: '' } : r));
    expect(evaluateCdcCompleteness(withEmpty).ready).toBe(false);
  });
});

describe('evaluateCdcGate', () => {
  it('refuse un CDC partiellement analysé même si des exigences existent', () => {
    const gate = evaluateCdcGate({ status: 'draft', requirements: complete });
    expect(gate.ready).toBe(false);
    expect(gate.missing).toContain('validation');
  });

  it('refuse un statut validé avec des exigences non confirmées', () => {
    const gate = evaluateCdcGate({
      status: 'requirements_validated',
      requirements: complete.map((r, i) => (i === 0 ? { ...r, status: 'to_verify' } : r)),
    });
    expect(gate.ready).toBe(false);
    expect(gate.missing.length).toBeGreaterThan(0);
  });

  it('accepte un statut validé avec toutes les exigences confirmées', () => {
    expect(
      evaluateCdcGate({ status: 'requirements_validated', requirements: complete }).ready,
    ).toBe(true);
  });

  it('accepte un projet historique valide sans exigences analysées', () => {
    expect(evaluateCdcGate({ status: 'requirements_validated', requirements: [] }).ready).toBe(
      true,
    );
  });
});
