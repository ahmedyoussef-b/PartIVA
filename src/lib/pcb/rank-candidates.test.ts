import { describe, expect, it } from 'vitest';
import { buildRankPrompt, parseRankResponse, type RankCandidate } from './rank-candidates';

const CANDS: RankCandidate[] = [
  {
    id: 'c1',
    name: 'Résistance 10k',
    category: 'resistor',
    footprint: 'R_0603',
    supplier: 'Mouser',
  },
  {
    id: 'c2',
    name: 'Condensateur 100n',
    category: 'capacitor',
    footprint: 'C_0603',
    supplier: 'DigiKey',
  },
  { id: 'c3', name: 'STM32F103', category: 'mcu', footprint: 'LQFP-48', supplier: null },
];

describe('buildRankPrompt', () => {
  it('1. contient chaque id et nom', () => {
    const p = buildRankPrompt('CDC', CANDS);
    for (const c of CANDS) {
      expect(p).toContain(c.id);
      expect(p).toContain(c.name);
    }
  });

  it('2. tronque un CDC de 5000 caractères à 2000', () => {
    const long = 'x'.repeat(5000);
    const p = buildRankPrompt(long, CANDS);
    expect(p).toContain('x'.repeat(2000));
    expect(p).not.toContain('x'.repeat(2001));
  });
});

describe('parseRankResponse', () => {
  it('3. { ids: [b,a] } → ordre [b,a]', () => {
    const r = parseRankResponse('{"ids":["c2","c1"]}', CANDS);
    expect(r.parsed).toBe(true);
    expect(r.ids.slice(0, 2)).toEqual(['c2', 'c1']);
  });

  it('4. tableau nu ["b","a"] → ordre [b,a]', () => {
    const r = parseRankResponse('["c2","c1"]', CANDS);
    expect(r.parsed).toBe(true);
    expect(r.ids.slice(0, 2)).toEqual(['c2', 'c1']);
  });

  it('5. tableau d\'objets [{id:"b"},{id:"a"}] → ordre [b,a]', () => {
    const r = parseRankResponse('[{"id":"c2"},{"id":"c1"}]', CANDS);
    expect(r.parsed).toBe(true);
    expect(r.ids.slice(0, 2)).toEqual(['c2', 'c1']);
  });

  it('6. id inconnu "zzz" → unknownIds, ignoré de l\'ordre', () => {
    const r = parseRankResponse('{"ids":["zzz","c1"]}', CANDS);
    expect(r.unknownIds).toEqual(['zzz']);
    expect(r.ids).not.toContain('zzz');
    expect(r.ids[0]).toBe('c1');
  });

  it('7. doublon "a","a","b" → dédupliqué [a,b]', () => {
    const r = parseRankResponse('{"ids":["c1","c1","c2"]}', CANDS);
    expect(r.ids.slice(0, 2)).toEqual(['c1', 'c2']);
    expect(r.ids.filter((id) => id === 'c1')).toHaveLength(1);
  });

  it('8. candidat non cité → missingIds + queue', () => {
    const r = parseRankResponse('{"ids":["c2"]}', CANDS);
    expect(r.missingIds).toEqual(['c1', 'c3']);
    expect(r.ids).toEqual(['c2', 'c1', 'c3']);
  });

  it('9. JSON invalide → parsed false, ordre d entrée préservé', () => {
    const r = parseRankResponse('not-json', CANDS);
    expect(r.parsed).toBe(false);
    expect(r.ids).toEqual(['c1', 'c2', 'c3']);
    expect(r.missingIds).toEqual([]);
    expect(r.unknownIds).toEqual([]);
  });

  it('10. tableau vide [] → parsed false, ordre d entrée', () => {
    const r = parseRankResponse('[]', CANDS);
    expect(r.parsed).toBe(false);
    expect(r.ids).toEqual(['c1', 'c2', 'c3']);
  });

  it('11. aucun candidat + {"ids":[]} → ids vide, parsed true', () => {
    const r = parseRankResponse('{"ids":[]}', []);
    expect(r.parsed).toBe(true);
    expect(r.ids).toEqual([]);
    expect(r.ranked).toEqual([]);
  });
});
