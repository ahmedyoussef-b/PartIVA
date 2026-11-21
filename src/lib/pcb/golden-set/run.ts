// V35.2 — Orchestrateur du golden set.
// Exécution SÉQUENTIELLE (le LLM a un rate limit) et isolation des échecs :
// un cas qui échoue ne doit jamais interrompre les suivants.
//
// Usage manuel :
//   const { average } = await runGoldenSet({
//     analyze: async (cdc) => {
//       // POST /api/pcb/analyze ou appel direct à callGroq(...)
//     },
//   });

import type { GoldenCase } from './cases';
import { GOLDEN_CASES } from './cases';
import { scoreGoldenCase, type GoldenScore } from './score';

export interface GoldenRunOptions {
  analyze: (cdc: string) => Promise<unknown>;
  cases?: GoldenCase[];
  onCase?: (result: { caseId: string; score: GoldenScore; error?: string }) => void;
}

export interface GoldenRunResult {
  scores: GoldenScore[];
  average: number;
  failures: Array<{ caseId: string; error: string }>;
}

function fallbackScore(caseId: string): GoldenScore {
  return {
    caseId,
    dimensionScore: 0,
    recallScore: 0,
    validityScore: 0,
    overall: 0,
    details: {
      missingKinds: [],
      extraKinds: [],
      missingMentions: [],
      invalidCount: 0,
    },
  };
}

export async function runGoldenSet(options: GoldenRunOptions): Promise<GoldenRunResult> {
  const cases = options.cases ?? GOLDEN_CASES;

  const scores: GoldenScore[] = [];
  const failures: Array<{ caseId: string; error: string }> = [];

  for (const golden of cases) {
    let score: GoldenScore;
    let error: string | undefined;

    try {
      const actual = await options.analyze(golden.cdc);
      score = scoreGoldenCase(golden, actual);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      failures.push({ caseId: golden.id, error });
      score = fallbackScore(golden.id);
    }

    scores.push(score);
    options.onCase?.({ caseId: golden.id, score, error });
  }

  const average =
    scores.length === 0 ? 0 : scores.reduce((sum, s) => sum + s.overall, 0) / scores.length;

  return { scores, average, failures };
}
