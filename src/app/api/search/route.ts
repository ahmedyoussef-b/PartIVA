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

/**
 * Connecteurs actifs (D-E3-26).
 * CADENAS (D-E3-19) et OpenSERP (D-openserp-instance)
 * sont EXCLUS — non fonctionnels.
 *
 * Ordre = poids décroissant (D-E3-23) : la
 * déduplication (D-E3-24) privilégie la source
 * la plus fiable (local_db > wikidata > traceparts > tecdoc).
 */
const ALL_CONNECTORS = [localDbConnector, wikidataConnector, tracePartsConnector, tecDocConnector];

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
      });

      const results = await multiSearch({
        q: validatedMulti.q,
        reference: validatedMulti.reference,
        specs: validatedMulti.specs,
        specKey: validatedMulti.specKey,
        min: validatedMulti.min,
        max: validatedMulti.max,
        dimensionKey: validatedMulti.dimensionKey,
        matchMode: validatedMulti.matchMode,
        clientId,
        limit: validatedMulti.limit,
      });

      return NextResponse.json({
        mode: 'multi',
        count: results.length,
        results,
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
