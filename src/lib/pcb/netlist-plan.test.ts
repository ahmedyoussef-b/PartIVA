import { describe, expect, it } from 'vitest';
import { buildNetPlan, normalizeNetPins, type CurrentNet } from './netlist-plan';

const current: CurrentNet[] = [
  { id: 'n1', name: 'VCC', pins: ['U1.8', 'C1.1'], source: 'llm' },
  { id: 'n2', name: 'GND', pins: ['U1.1', 'C1.2'], source: 'llm' },
];

describe('normalizeNetPins', () => {
  it('ne garde que les pins au format REF.PIN', () => {
    expect(normalizeNetPins([' U1.1 ', 'U1-2', '', 42, 'C1.2'])).toEqual(['U1.1', 'C1.2']);
  });
});

describe('buildNetPlan', () => {
  it('ne produit aucune opération si rien n’a changé', () => {
    const plan = buildNetPlan(current, current);
    expect(plan).toMatchObject({
      deleteIds: [],
      updates: [],
      creates: [],
      issues: [],
      unknownIds: [],
    });
  });

  it('gère un échange de noms entre deux nets (swap)', () => {
    const plan = buildNetPlan(current, [
      { id: 'n1', name: 'GND', pins: ['U1.1', 'C1.2'] },
      { id: 'n2', name: 'VCC', pins: ['U1.8', 'C1.1'] },
    ]);
    expect(plan.updates).toEqual([
      { id: 'n1', name: 'GND', pins: ['U1.1', 'C1.2'] },
      { id: 'n2', name: 'VCC', pins: ['U1.8', 'C1.1'] },
    ]);
    expect(plan.deleteIds).toEqual([]);
    expect(plan.creates).toEqual([]);
    expect(plan.issues).toEqual([]);
  });

  it('supprime puis recrée un même nom sans conflit', () => {
    const plan = buildNetPlan([current[0]!], [{ name: 'VCC', pins: ['U1.8', 'C1.2'] }]);
    expect(plan.deleteIds).toEqual(['n1']);
    expect(plan.creates).toEqual([{ name: 'VCC', pins: ['U1.8', 'C1.2'] }]);
    expect(plan.updates).toEqual([]);
    expect(plan.issues).toEqual([]);
  });

  it('détecte un identifiant devenu introuvable (dérive)', () => {
    const plan = buildNetPlan(current, [
      { id: 'ghost', name: 'SIG', pins: ['U1.2', 'C1.2'] },
      { id: 'n1', name: 'VCC', pins: ['U1.8', 'C1.1'] },
    ]);
    expect(plan.unknownIds).toEqual(['ghost']);
    expect(plan.deleteIds).toEqual(['n2']);
  });

  it('rejette les noms dupliqués indépendamment de la casse', () => {
    const plan = buildNetPlan(current, [
      { name: 'VCC', pins: ['U1.8', 'C1.1'] },
      { name: 'vcc', pins: ['U1.7', 'C1.2'] },
    ]);
    expect(plan.issues.some((i) => i.code === 'DUPLICATE_NAME')).toBe(true);
  });

  it('rejette un identifiant répété deux fois', () => {
    const plan = buildNetPlan(current, [
      { id: 'n1', name: 'VCC', pins: ['U1.8', 'C1.1'] },
      { id: 'n1', name: 'VCC2', pins: ['U1.7', 'C1.1'] },
    ]);
    expect(plan.issues.some((i) => i.code === 'DUPLICATE_ID')).toBe(true);
  });

  it('signale un nom vide et un net trop court sans écrire', () => {
    const plan = buildNetPlan(
      [],
      [
        { name: '   ', pins: ['U1.1', 'C1.1'] },
        { name: 'SIG', pins: ['U1.1'] },
      ],
    );
    expect(plan.issues.map((i) => i.code)).toEqual(['EMPTY_NAME', 'TOO_FEW_PINS']);
  });

  it('compare les pins sans tenir compte de l’ordre', () => {
    const plan = buildNetPlan(current, [
      { id: 'n1', name: 'VCC', pins: ['C1.1', 'U1.8'] },
      { id: 'n2', name: 'GND', pins: ['U1.1', 'C1.2'] },
    ]);
    expect(plan.updates).toEqual([]);
  });
});
