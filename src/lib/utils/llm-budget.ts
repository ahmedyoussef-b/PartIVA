// Coupe-circuit budgétaire LLM (F1).
// Compteur de tokens par jour UTC, persistant (L2 Prisma) avec repli mémoire L1.
// Toute fonction qui appelle un LLM doit appeler `assertDailyBudget()` avant,
// puis `addDailyTokens()` après, afin de refuser tout appel au-delà du plafond.

const DB_TIMEOUT_MS = 800;
const SYNC_INTERVAL_MS = 10_000;

export const DEFAULT_DAILY_TOKEN_BUDGET = 100_000;

export class LlmBudgetExceededError extends Error {
  constructor(public readonly limit: number) {
    super(`Budget LLM journalier dépassé (${limit} tokens)`);
    this.name = 'LlmBudgetExceededError';
  }
}

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

let memoryDay = '';
let memoryTokens = 0;
let lastSync = 0;

export function getDailyBudget(): number {
  const raw = Number(process.env.LLM_DAILY_TOKEN_BUDGET ?? DEFAULT_DAILY_TOKEN_BUDGET);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_DAILY_TOKEN_BUDGET;
}

function withDbTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), DB_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

function resetMemoryIfNewDay(): void {
  const day = utcDay();
  if (memoryDay !== day) {
    memoryDay = day;
    memoryTokens = 0;
    lastSync = 0;
  }
}

async function readDbTokens(): Promise<number | null> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const row = await withDbTimeout(
      prisma.llmDailyUsage.findUnique({ where: { day: utcDay() } }),
      null,
    );
    return row ? row.tokens : 0;
  } catch {
    return null;
  }
}

export async function getDailyTokens(): Promise<number> {
  resetMemoryIfNewDay();
  if (Date.now() - lastSync < SYNC_INTERVAL_MS) return memoryTokens;

  const db = await readDbTokens();
  if (db !== null) memoryTokens = db;
  lastSync = Date.now();
  return memoryTokens;
}

export function addDailyTokens(tokens: number): void {
  if (!Number.isFinite(tokens) || tokens <= 0) return;
  resetMemoryIfNewDay();
  memoryTokens += tokens;
  lastSync = Date.now();

  // Écriture DB en arrière-plan : ne bloque jamais l'appel LLM.
  void (async () => {
    try {
      const { prisma } = await import('@/lib/prisma');
      const day = utcDay();
      await withDbTimeout(
        prisma.llmDailyUsage.upsert({
          where: { day },
          create: { day, tokens },
          update: { tokens: { increment: tokens } },
        }),
        undefined,
      );
    } catch {
      // best-effort : le compteur mémoire protège l'instance courante
    }
  })();
}

export async function assertDailyBudget(): Promise<void> {
  const budget = getDailyBudget();
  if (budget <= 0) return;
  const used = await getDailyTokens();
  if (used >= budget) {
    console.warn('[LLM:budget] Appel refusé — budget journalier atteint', { used, budget });
    throw new LlmBudgetExceededError(budget);
  }
}
