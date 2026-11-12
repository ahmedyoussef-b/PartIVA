import { aggregateSearchRouted } from '@/lib/connectors/aggregator';
import { ALL_CONNECTORS } from '@/lib/connectors';

async function main() {
  try {
    console.log("🔍 Test d'intégration : agrégation multi-sources");
    console.log('Source: all, Query: frein, Limit: 5');
    console.log('---');

    const result = await aggregateSearchRouted(
      ALL_CONNECTORS,
      [
        { sourceId: 'local_db', query: 'frein', isFallback: false },
        { sourceId: 'wikidata', query: 'frein', isFallback: false },
        { sourceId: 'traceparts', query: 'frein', isFallback: false },
        { sourceId: 'tecdoc', query: 'frein', isFallback: false },
        { sourceId: 'industrial_catalog', query: 'frein', isFallback: false },
        { sourceId: '3dcarparts', query: 'frein', isFallback: false },
        { sourceId: 'fapi', query: 'frein', isFallback: false },
        { sourceId: 'geometric', query: 'frein', isFallback: false },
      ],
      { limit: 5, source: 'all' },
    );

    console.log(`Statut: ${result.sourcesFailed.length === 0 ? 'SUCCÈS' : 'PARTIEL'}`);
    console.log(`Sources interrogées: ${result.sourcesQueried.join(', ')}`);
    console.log(
      `Sources en échec: ${result.sourcesFailed.length > 0 ? result.sourcesFailed.join(', ') : 'aucune'}`,
    );
    console.log(`Durée totale: ${result.totalDurationMs}ms`);
    console.log(`Durée par source:`, result.sourceDurationsMs);
    console.log(`Candidats: ${result.candidates.length}`);
    result.candidates.forEach((c: { source: string; name: string }) =>
      console.log(`  - ${c.source}: ${c.name}`),
    );

    if (result.candidates.length === 0) {
      console.error('ERREUR: Aucun candidat retourné.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Erreur:', err);
    process.exit(1);
  }
}

main();
