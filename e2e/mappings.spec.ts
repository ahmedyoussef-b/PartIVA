import { test, expect } from '@playwright/test';
import { mapWikidataToCandidate } from '../src/lib/data/wikidata';
import { mapTracePartsToCandidate } from '../src/lib/data/traceparts';
import { wikidataConnector } from '../src/lib/connectors/wikidata';
import type { WikidataBinding } from '../src/lib/data/wikidata';
import type { TracePartsProduct } from '../src/lib/data/traceparts';

/**
 * Tests E2E — Adaptateurs de mapping (E4-S03, D-E3-34).
 *
 * Vérifie que les mappings intermédiaires (mapWikidataToCandidate,
 * mapTracePartsToCandidate) et les adaptateurs E3-S05 (wrappers)
 * produisent des SearchCandidate valides.
 */
test.describe('Candidate mapping adapters (E4-S03)', () => {
  test.setTimeout(90_000);

  test('mapWikidataToCandidate → mapping intermédiaire valide', () => {
    const binding: WikidataBinding = {
      item: { type: 'uri', value: 'https://www.wikidata.org/wiki/Q1' },
      itemLabel: { type: 'literal', value: 'Bearing' },
      itemDescription: { type: 'literal', value: 'Mechanical component' },
    };

    const mapped = mapWikidataToCandidate(binding);

    expect(mapped.source).toBe('wikidata');
    expect(mapped.sourceId).toBe(binding.item.value);
    expect(mapped.name).toBe(binding.itemLabel.value);
    expect(mapped.description).toBe('Mechanical component');
    expect(mapped.url).toBe(binding.item.value);
  });

  test('mapTracePartsToCandidate → mapping intermédiaire valide', () => {
    const product: TracePartsProduct = {
      id: 'TP-001',
      name: 'Vis M8x30',
      description: 'Vis ISO 4017',
      manufacturer: 'TraceParts',
      partNumber: 'ISO4017-M8x30',
      category: 'Fixation',
      cadAvailable: true,
      cadFormats: ['STEP'],
      thumbnailUrl: 'https://example.com/tp-001.png',
      productUrl: 'https://example.com/tp/001',
    };

    const mapped = mapTracePartsToCandidate(product);

    expect(mapped.source).toBe('traceparts');
    expect(mapped.sourceId).toBe(product.id);
    expect(mapped.name).toBe(product.name);
    expect(mapped.cadAvailable).toBe(true);
    expect(mapped.partNumber).toBe('ISO4017-M8x30');
  });

  test('adaptateur E3-S05 (wikidataConnector) produit SearchCandidate complet', async () => {
    const results = await wikidataConnector.search('bearing', { limit: 1 });

    if (results.length === 0) {
      test.skip(true, 'Aucun résultat Wikidata — adaptateur non testable');
      return;
    }

    const candidate = results[0]!;
    // SearchCandidate complet (D-E3-34)
    expect(candidate).toHaveProperty('id');
    expect(candidate).toHaveProperty('source');
    expect(candidate).toHaveProperty('reference');
    expect(candidate).toHaveProperty('name');
    expect(candidate).toHaveProperty('scores');
    expect(candidate.source).toBe('wikidata');
    expect(candidate.id).toMatch(/^wikidata:/);
    expect(candidate.scores.global).toBe(0.8);
  });
});
