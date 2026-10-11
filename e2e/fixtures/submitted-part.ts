import { execFileSync } from 'node:child_process';
import { expect } from '@playwright/test';

export interface SubmittedPart {
  id: string;
  partNumber: string;
}

/**
 * Crée une part SUBMITTED via Prisma (script tsx, pattern seed).
 * Utilisée en beforeEach par les specs consommatrices de SUBMITTED
 * (D-e2e-submitted-consumption) — la transition SUBMITTED->IDENTIFYING
 * est irréversible et consomme le stock du seed, d'où la recréation
 * ciblée.
 *
 * Pourquoi un script tsx et pas l'API :
 * - POST /api/parts est inutilisable — NewPartSchema (Zod) exige
 *   `reference`/`material`/`dimensions`/`version`/`files` qui
 *   n'existent pas dans le modèle Prisma Part (incohérence
 *   schema/Prisma pré-existante : PrismaClientValidationError
 *   "Unknown argument `reference`").
 * - L'import direct de @/lib/prisma dans les specs échoue (le
 *   client Prisma généré est ESM, Playwright charge en CJS :
 *   "Cannot use 'import.meta' outside a module").
 * - tsx résout les aliases @/* via tsconfig (comme prisma/seed.ts).
 *
 * Les parts créées persistent en DB (pas de DELETE /api/parts/[id]) —
 * dette D-e2e-submitted-residues (Faible).
 */
export async function ensureSubmittedPart(): Promise<SubmittedPart> {
  const suffix = Date.now().toString();
  const partNumber = `E2E-RESET-${suffix}`;
  const name = `Pièce reset E2E ${suffix}`;

  const tsxCli = `${process.cwd()}/node_modules/tsx/dist/cli.mjs`;
  const output = execFileSync(
    process.execPath,
    [tsxCli, 'e2e/fixtures/create-submitted-part.mts', partNumber, name],
    { cwd: process.cwd(), encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
  );

  const created = JSON.parse(output.trim()) as SubmittedPart;
  expect(created.id).toBeTruthy();
  expect(created.partNumber).toBe(partNumber);

  return created;
}
