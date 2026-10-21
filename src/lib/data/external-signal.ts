/**
 * E25-R1 — fusion des signaux d'annulation pour les appels HTTP externes
 * (TecDoc, TraceParts, Wikidata).
 *
 * `fetch` n'accepte qu'un seul `signal` : le timeout interne de la source et le
 * signal global de l'agrégateur doivent être combinés. Sans cela, une source
 * lente ignorait le timeout de l'agrégateur (D-E3-21) et l'API `/api/search`
 * bloquait le temps total des retries (~31 s observés sur TecDoc).
 */
export function mergeAbortSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (!signal) continue;
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return controller.signal;
}
