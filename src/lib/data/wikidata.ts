import { z } from 'zod';

/**
 * Schéma Zod — réponse Wikidata SPARQL (format JSON standard).
 * Endpoint : https://query.wikidata.org/sparql?format=json&query=...
 * Doc : https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual
 *
 * Structure SPARQL JSON (validée contre fixture réelle Bloc 0) :
 * { "head": { "vars": [...] }, "results": { "bindings": [...] } }
 *
 * Chaque littéral porte "type" ("uri"|"literal") et éventuellement
 * "xml:lang". Le schéma accepte ces métadonnées sans les contraindre.
 */
export const WikidataValueSchema = z.object({
  type: z.string(),
  value: z.string(),
  'xml:lang': z.string().optional(),
});

export type WikidataValue = z.infer<typeof WikidataValueSchema>;

export const WikidataBindingSchema = z.object({
  item: WikidataValueSchema,
  itemLabel: WikidataValueSchema,
  itemDescription: WikidataValueSchema.optional(),
});

export type WikidataBinding = z.infer<typeof WikidataBindingSchema>;

export const WikidataSparqlResponseSchema = z.object({
  head: z.object({
    vars: z.array(z.string()),
  }),
  results: z.object({
    bindings: z.array(WikidataBindingSchema),
  }),
});

export type WikidataSparqlResponse = z.infer<typeof WikidataSparqlResponseSchema>;

// --- Configuration ---

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';
const WIKIDATA_TIMEOUT_MS = 15_000;
const WIKIDATA_MAX_RETRIES = 2;

/**
 * User-Agent obligatoire (politique Wikimedia).
 * Sans User-Agent identifiable, Wikidata retourne HTTP 403.
 * Sécurité #7 : pas de NEXT_PUBLIC_.
 */
function getWikidataUserAgent(): string {
  return (
    process.env.WIKIDATA_USER_AGENT ??
    'PartIVA/1.0 (https://partiva.example; contact@partiva.example)'
  );
}

/**
 * Wikidata est public — toujours disponible.
 * (Fonction conservée pour cohérence avec les autres connecteurs.)
 */
export function isWikidataConfigured(): boolean {
  return true;
}

/**
 * Échappe une chaîne pour inclusion dans une requête SPARQL.
 * Évite l'injection SPARQL (guillemets, backslashes, retours ligne).
 */
function escapeSparqlString(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

/**
 * Construit une requête SPARQL de recherche par label exact.
 * Wikidata indexe les labels (`?item rdfs:label "X"@en`) mais
 * PAS les regex/prefixes sur labels (full scan → 504/timeout).
 * La recherche par dénomination normalisée (label exact) est
 * donc la stratégie performante — pertinente métier pour
 * PartIVA (pièces désignées par leur nom normalisé).
 *
 * @param query - Terme de recherche (label exact)
 * @param limit - Nombre max de résultats
 */
function buildSearchQuery(query: string, limit: number): string {
  const escaped = escapeSparqlString(query.trim());
  const capitalized = escaped.charAt(0).toUpperCase() + escaped.slice(1);
  return `
    SELECT ?item ?itemLabel ?itemDescription WHERE {
      ?item rdfs:label "${capitalized}"@en .
      OPTIONAL {
        ?item schema:description ?itemDescription .
        FILTER(LANG(?itemDescription) = "en")
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
    }
    LIMIT ${limit}
  `.trim();
}

/**
 * Recherche Wikidata SPARQL — appel HTTP réel.
 *
 * @param query - Terme de recherche
 * @param options - Limite de résultats
 * @returns Réponse validée par WikidataSparqlResponseSchema
 *
 * @throws Error si l'endpoint est injoignable ou la réponse invalide
 */
export async function searchWikidata(
  query: string,
  options: { limit?: number } = {},
): Promise<WikidataSparqlResponse> {
  const { limit = 10 } = options;

  const sparqlQuery = buildSearchQuery(query, limit);
  const url = new URL(WIKIDATA_ENDPOINT);
  url.searchParams.set('query', sparqlQuery);
  url.searchParams.set('format', 'json');

  const headers: Record<string, string> = {
    Accept: 'application/sparql-results+json',
    'User-Agent': getWikidataUserAgent(),
  };

  let lastError: unknown;
  for (let attempt = 0; attempt <= WIKIDATA_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), WIKIDATA_TIMEOUT_MS);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Wikidata HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return WikidataSparqlResponseSchema.parse(json);
    } catch (error) {
      lastError = error;
      if (attempt < WIKIDATA_MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw new Error(
    `Wikidata search failed after ${WIKIDATA_MAX_RETRIES + 1} attempts: ${String(lastError)}`,
  );
}

// --- Recherche partielle (D-E3-33) ---

const WIKIDATA_API_ENDPOINT = 'https://www.wikidata.org/w/api.php';

/**
 * Recherche partielle via wbsearchentities (D-E3-33).
 * Retourne une liste de Q-IDs correspondant au terme.
 *
 * wbsearchentities (API MediaWiki) permet une recherche
 * partielle (« bear » → « bearing »), contrairement à
 * SPARQL qui n'indexe que les labels exacts.
 */
async function searchWikidataEntities(query: string, limit: number): Promise<string[]> {
  const url = new URL(WIKIDATA_API_ENDPOINT);
  url.searchParams.set('action', 'wbsearchentities');
  url.searchParams.set('search', query);
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': getWikidataUserAgent(),
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Wikidata wbsearchentities HTTP ${response.status}: ${response.statusText}`);
  }

  const json = (await response.json()) as {
    search?: Array<{ id: string }>;
  };
  return (json.search ?? []).map((r) => r.id);
}

/**
 * Recherche Wikidata — mode partiel (D-E3-33).
 * Utilise wbsearchentities en amont, puis SPARQL par Q-IDs.
 *
 * @param query - Terme de recherche (partiel)
 * @param options - Limite de résultats
 * @returns Réponse validée par WikidataSparqlResponseSchema
 *
 * @throws Error si l'endpoint est injoignable ou la réponse invalide
 */
export async function searchWikidataPartial(
  query: string,
  options: { limit?: number } = {},
): Promise<WikidataSparqlResponse> {
  const { limit = 10 } = options;

  // 1. Recherche partielle → Q-IDs
  const qids = await searchWikidataEntities(query, limit);
  if (qids.length === 0) {
    return { head: { vars: [] }, results: { bindings: [] } };
  }

  // 2. SPARQL par Q-IDs
  const qidList = qids.map((id) => `wd:${id}`).join(' ');
  const sparqlQuery = `
    SELECT ?item ?itemLabel ?itemDescription WHERE {
      VALUES ?item { ${qidList} }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
    }
  `.trim();

  const url = new URL(WIKIDATA_ENDPOINT);
  url.searchParams.set('query', sparqlQuery);
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': getWikidataUserAgent(),
      Accept: 'application/sparql-results+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Wikidata SPARQL HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  return WikidataSparqlResponseSchema.parse(json);
}

/**
 * Mapping Wikidata → SearchCandidate (normalisation).
 * Utilisé par le pipeline d'agrégation (E3-S05).
 */
export function mapWikidataToCandidate(binding: WikidataBinding): {
  source: 'wikidata';
  sourceId: string;
  name: string;
  description: string | null;
  url: string;
} {
  return {
    source: 'wikidata',
    sourceId: binding.item.value,
    name: binding.itemLabel.value,
    description: binding.itemDescription?.value ?? null,
    url: binding.item.value,
  };
}
