import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getSearchCandidates } from '@/lib/data/search-candidates';
import {
  searchParts,
  searchPartsByReference,
  searchPartsBySpecs,
  searchPartsByDimensions,
} from '@/lib/data/search';
import { PartSearchQuerySchema, MultiSearchQuerySchema } from '@/schemas/search';
import { multiSearch } from '@/lib/data/multi-search';
import { aggregateSearch } from '@/lib/connectors/aggregator';
import { localDbConnector } from '@/lib/connectors/local-db';
import { wikidataConnector } from '@/lib/connectors/wikidata';
import { tracePartsConnector } from '@/lib/connectors/traceparts';
import { tecDocConnector } from '@/lib/connectors/tecdoc';
import { industrialCatalogConnector } from '@/lib/connectors/industrial-catalog';

/**
 * Connecteurs actifs (D-E3-26).
 * CADENAS (D-E3-19) et OpenSERP (D-openserp-instance)
 * sont EXCLUS — non fonctionnels.
 *
 * Ordre = poids décroissant (D-E3-23) : la
 * déduplication (D-E3-24) privilégie la source
 * la plus fiable (local_db > wikidata > traceparts > industrial_catalog > tecdoc).
 */
const ALL_CONNECTORS = [
  localDbConnector,
  wikidataConnector,
  tracePartsConnector,
  industrialCatalogConnector,
  tecDocConnector,
];

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { source, query, limit } = body;

    // Agrégation multi-sources (D-E3-25)
    if (source === 'all') {
      const result = await aggregateSearch(ALL_CONNECTORS, String(query ?? ''), {
        limit: typeof limit === 'number' ? limit : 20,
      });
      return NextResponse.json(result);
    }

    if (source) {
      const filtered = await getSearchCandidates({ source });
      return NextResponse.json(filtered);
    }

    const sorted = await getSearchCandidates();
    sorted.sort((a, b) => b.scores.global - a.scores.global);
    return NextResponse.json(sorted);
  } catch {
    return NextResponse.json({ error: 'Erreur moteur de recherche' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const modeParam = searchParams.get('mode');

    const isUser = session.user.role === 'USER';
    const clientId = isUser ? session.user.id : undefined;

    if (modeParam === 'multi') {
      const validatedMulti = MultiSearchQuerySchema.parse({
        q: searchParams.get('q') ?? undefined,
        reference: searchParams.get('reference') ?? undefined,
        specs: searchParams.get('specs') ?? undefined,
        specKey: searchParams.get('specKey') ?? undefined,
        min: searchParams.get('min') ?? undefined,
        max: searchParams.get('max') ?? undefined,
        dimensionKey: searchParams.get('dimensionKey') ?? undefined,
        matchMode: searchParams.get('matchMode') ?? undefined,
        limit: searchParams.get('limit') ?? undefined,
        material: searchParams.get('material') ?? undefined,
        status: searchParams.get('status') ?? undefined,
        createdAfter: searchParams.get('createdAfter') ?? undefined,
        createdBefore: searchParams.get('createdBefore') ?? undefined,
        minScore: searchParams.get('minScore') ?? undefined,
        sort: searchParams.get('sort') ?? undefined,
        offset: searchParams.get('offset') ?? undefined,
      });

      let results = await multiSearch({
        q: validatedMulti.q,
        reference: validatedMulti.reference,
        specs: validatedMulti.specs,
        specKey: validatedMulti.specKey,
        min: validatedMulti.min,
        max: validatedMulti.max,
        dimensionKey: validatedMulti.dimensionKey,
        matchMode: validatedMulti.matchMode,
        clientId,
        limit: (validatedMulti.limit ?? 20) + (validatedMulti.offset ?? 0), // récupérer assez pour paginer
      });

      // Filtres avancés (E12-R1b)
      if (validatedMulti.material) {
        results = results.filter((r) => r.material === validatedMulti.material);
      }
      if (validatedMulti.status) {
        results = results.filter((r) => r.status === validatedMulti.status);
      }
      if (validatedMulti.createdAfter) {
        const after = new Date(validatedMulti.createdAfter);
        results = results.filter((r) => new Date(r.createdAt) >= after);
      }
      if (validatedMulti.createdBefore) {
        const before = new Date(validatedMulti.createdBefore);
        results = results.filter((r) => new Date(r.createdAt) <= before);
      }
      if (validatedMulti.minScore !== undefined) {
        results = results.filter((r) => r.score >= validatedMulti.minScore!);
      }

      // Tri (E12-R1b)
      switch (validatedMulti.sort) {
        case 'date':
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'name':
          results.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
          break;
        case 'status': {
          const statusOrder = ['DRAFT', 'SUBMITTED', 'VALIDATED', 'ARCHIVED'];
          results.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
          break;
        }
        default: // relevance
          results.sort((a, b) => b.score - a.score);
      }

      // Pagination (E12-R1b)
      const total = results.length;
      const offset = validatedMulti.offset ?? 0;
      const limit = validatedMulti.limit ?? 20;
      const paginated = results.slice(offset, offset + limit);

      return NextResponse.json({
        mode: 'multi',
        count: paginated.length,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        results: paginated,
      });
    }

    const validated = PartSearchQuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      mode: modeParam ?? undefined,
      key: searchParams.get('key') ?? undefined,
      min: searchParams.get('min') ?? undefined,
      max: searchParams.get('max') ?? undefined,
      matchMode: searchParams.get('matchMode') ?? undefined,
    });

    const results =
      validated.mode === 'reference'
        ? await searchPartsByReference(validated.q!, {
            clientId,
            limit: validated.limit,
          })
        : validated.mode === 'specs'
          ? await searchPartsBySpecs(validated.q!, {
              key: validated.key,
              clientId,
              limit: validated.limit,
            })
          : validated.mode === 'dimensions'
            ? await searchPartsByDimensions({
                min: validated.min,
                max: validated.max,
                key: validated.key,
                matchMode: validated.matchMode ?? 'nominal',
                clientId,
                limit: validated.limit,
              })
            : await searchParts(validated.q!, {
                clientId,
                limit: validated.limit,
              });

    return NextResponse.json({
      query: validated.q,
      mode: validated.mode,
      count: results.length,
      results,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ message: 'Payload invalide' }, { status: 400 });
    }
    console.error('Error searching parts:', error);
    return NextResponse.json({ message: 'Erreur recherche' }, { status: 400 });
  }
}
