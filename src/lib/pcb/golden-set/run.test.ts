import { describe, expect, it, vi } from 'vitest';
import { GOLDEN_CASES, type GoldenCase } from './cases';
import { runGoldenSet } from './run';

function perfectOutput(golden: GoldenCase): { requirements: Array<Record<string, unknown>> } {
  const reqs: Array<Record<string, unknown>> = [];

  if (golden.expected.boardWidthMm !== undefined) {
    reqs.push({
      category: 'mechanical',
      key: 'Largeur',
      value: String(golden.expected.boardWidthMm),
      status: 'proposed',
    });
  }
  if (golden.expected.boardHeightMm !== undefined) {
    reqs.push({
      category: 'mechanical',
      key: 'Hauteur',
      value: String(golden.expected.boardHeightMm),
      status: 'proposed',
    });
  }

  golden.expected.componentKinds.forEach((kind, index) => {
    reqs.push({
      category: kind,
      key: `Champ ${index}`,
      value: `valeur ${index}`,
      status: 'proposed',
    });
  });

  if (golden.expected.mustMention && golden.expected.mustMention.length > 0) {
    reqs.push({
      category: 'function',
      key: 'Contraintes',
      value: golden.expected.mustMention.join(' '),
      status: 'proposed',
    });
  }

  return { requirements: reqs };
}

const MINI_CASES: GoldenCase[] = [
  {
    id: 'mini-1',
    title: 'Mini 1',
    cdc: 'cahier des charges numero un pour tester la sequence de deroulement du golden set.',
    expected: { boardWidthMm: 10, boardHeightMm: 10, componentKinds: ['usage'] },
  },
  {
    id: 'mini-2',
    title: 'Mini 2',
    cdc: 'cahier des charges numero deux pour tester la sequence de deroulement du golden set.',
    expected: { boardWidthMm: 20, boardHeightMm: 20, componentKinds: ['function'] },
  },
  {
    id: 'mini-3',
    title: 'Mini 3',
    cdc: 'cahier des charges numero trois pour tester la sequence de deroulement du golden set.',
    expected: { boardWidthMm: 30, boardHeightMm: 30, componentKinds: ['processing'] },
  },
];

describe('runGoldenSet', () => {
  it('1. analyze conforme pour les 10 cas → average 1', async () => {
    const result = await runGoldenSet({
      analyze: async (cdc) => {
        const golden = GOLDEN_CASES.find((g) => g.cdc === cdc);
        if (!golden) throw new Error('cas introuvable');
        return perfectOutput(golden);
      },
    });

    expect(result.scores).toHaveLength(10);
    expect(result.failures).toEqual([]);
    expect(result.average).toBe(1);
  });

  it('2. analyze throw sur le 3e cas → les 10 sont traités', async () => {
    const onCase = vi.fn();
    const result = await runGoldenSet({
      cases: MINI_CASES,
      analyze: async (cdc) => {
        if (cdc === MINI_CASES[2]?.cdc) throw new Error('boom');
        const golden = MINI_CASES.find((g) => g.cdc === cdc);
        if (!golden) throw new Error('cas introuvable');
        return perfectOutput(golden);
      },
      onCase,
    });

    expect(result.scores).toHaveLength(3);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.caseId).toBe('mini-3');
    expect(result.failures[0]?.error).toBe('boom');
    expect(result.scores[0]?.overall).toBe(1);
    expect(result.scores[1]?.overall).toBe(1);
    expect(result.scores[2]?.overall).toBe(0);
    expect(result.average).toBeCloseTo(2 / 3, 5);
  });

  it('3. analyze throw sur tous → average 0, 3 failures', async () => {
    const result = await runGoldenSet({
      cases: MINI_CASES,
      analyze: async () => {
        throw new Error('ko');
      },
    });

    expect(result.average).toBe(0);
    expect(result.failures).toHaveLength(3);
    expect(result.failures.map((f) => f.caseId)).toEqual(['mini-1', 'mini-2', 'mini-3']);
  });

  it('4. onCase appelé une fois par cas', async () => {
    const onCase = vi.fn();
    await runGoldenSet({
      cases: MINI_CASES,
      analyze: async (cdc) => {
        const golden = MINI_CASES.find((g) => g.cdc === cdc);
        if (!golden) throw new Error('cas introuvable');
        return perfectOutput(golden);
      },
      onCase,
    });

    expect(onCase).toHaveBeenCalledTimes(3);
    expect(onCase.mock.calls.map((c) => c[0].caseId)).toEqual(['mini-1', 'mini-2', 'mini-3']);
  });

  it('5. ordre préservé', async () => {
    const result = await runGoldenSet({
      cases: MINI_CASES,
      analyze: async (cdc) => {
        const golden = MINI_CASES.find((g) => g.cdc === cdc);
        if (!golden) throw new Error('cas introuvable');
        return perfectOutput(golden);
      },
    });

    expect(result.scores[0]?.caseId).toBe(MINI_CASES[0]?.id);
    expect(result.scores.map((s) => s.caseId)).toEqual(['mini-1', 'mini-2', 'mini-3']);
  });

  it('6. cases vide → average 0, scores et failures vides', async () => {
    const analyze = vi.fn();
    const result = await runGoldenSet({ cases: [], analyze });

    expect(result.average).toBe(0);
    expect(result.scores).toEqual([]);
    expect(result.failures).toEqual([]);
    expect(analyze).not.toHaveBeenCalled();
  });
});
