// Garde anti-concurrence pour les appels LLM coûteux.
// Empêche les requêtes concurrentes identiques (double-clic, multi-onglets, retries).
// Garde en mémoire, best-effort : expire automatiquement après `ttlMs`.

export interface LlmGuard {
  ok: boolean;
  release: () => void;
}

const inFlight = new Map<string, number>();

export function hashKey(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function acquireLlmGuard(key: string, ttlMs = 120_000): LlmGuard {
  const now = Date.now();
  const until = inFlight.get(key);
  if (until && until > now) {
    return { ok: false, release: () => {} };
  }
  inFlight.set(key, now + ttlMs);
  let released = false;
  return {
    ok: true,
    release: () => {
      if (released) return;
      released = true;
      inFlight.delete(key);
    },
  };
}
