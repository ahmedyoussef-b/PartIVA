import type { NormalizedQuery } from './query-normalizer';

export interface RoutedQuery {
  sourceId: string;
  query: string;
  isFallback: boolean;
}

export function buildSmartRoutes(normalized: NormalizedQuery): RoutedQuery[] {
  const routes: RoutedQuery[] = [];

  // 1. step_parts : référence technique (ex: 608ZZ) ou mot-clé anglais
  const technicalRef = normalized.keywords.find((k) => /^[A-Z0-9-]{3,}$/i.test(k));
  if (technicalRef) {
    routes.push({ sourceId: 'step_parts', query: technicalRef, isFallback: false });
  }
  routes.push({
    sourceId: 'step_parts',
    query: normalized.type || normalized.english || normalized.original,
    isFallback: true,
  });

  // 2. CADENAS : marque ou catégorie
  const brand = normalized.keywords.find((k) =>
    ['igus', 'parker', 'smc', 'danfoss', 'pololu'].includes(k.toLowerCase()),
  );
  routes.push({
    sourceId: 'industrial_catalog',
    query: brand || normalized.type || normalized.original,
    isFallback: false,
  });

  // 3. FAPI : description française
  routes.push({ sourceId: 'fapi', query: normalized.original, isFallback: false });

  // 4. Wikidata : terme général
  routes.push({
    sourceId: 'wikidata',
    query: normalized.type || normalized.original,
    isFallback: false,
  });

  // 5. geometric : description complète
  routes.push({ sourceId: 'geometric', query: normalized.original, isFallback: false });

  return routes;
}
