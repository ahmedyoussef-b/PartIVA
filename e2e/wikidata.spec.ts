import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  searchWikidata,
  isWikidataConfigured,
  mapWikidataToCandidate,
  WikidataSparqlResponseSchema,
} from '../src/lib/data/wikidata';

test.describe('Wikidata connector (E3-S03)', () => {
  test.setTimeout(90_000);

  test('isWikidataConfigured retourne true (endpoint public)', () => {
    expect(isWikidataConfigured()).toBe(true);
  });

  test('recherche réelle "bearing" retourne des résultats', async () => {
    const result = await searchWikidata('bearing', { limit: 5 });
    expect(result.results.bindings.length).toBeGreaterThan(0);
    expect(result.head.vars).toContain('item');
  });

  test('recherche réelle "screw" retourne des résultats', async () => {
    const result = await searchWikidata('screw', { limit: 5 });
    expect(result.results.bindings.length).toBeGreaterThan(0);
  });

  test('limite respectée — limit=2 retourne ≤ 2 résultats', async () => {
    const result = await searchWikidata('valve', { limit: 2 });
    expect(result.results.bindings.length).toBeLessThanOrEqual(2);
  });

  test('mapping — Wikidata → SearchCandidate', async () => {
    const result = await searchWikidata('bearing', { limit: 1 });
    if (result.results.bindings.length === 0) {
      test.skip(true, 'Aucun résultat — mapping non testable');
      return;
    }

    const binding = result.results.bindings[0]!;
    const candidate = mapWikidataToCandidate(binding);
    expect(candidate.source).toBe('wikidata');
    expect(candidate.sourceId).toBe(binding.item.value);
    expect(candidate.name).toBe(binding.itemLabel.value);
    expect(candidate.url).toBe(binding.item.value);
  });

  test('schéma Zod — fixture réelle valide', () => {
    const fixturePath = path.resolve(process.cwd(), 'e2e/fixtures/wikidata-search.json');
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
    const parsed = WikidataSparqlResponseSchema.safeParse(fixture);
    expect(parsed.success).toBe(true);
  });
});
