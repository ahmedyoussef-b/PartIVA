/**
 * V1.3-A — UI Admin Reverse Engineering (read-only, sans 3D, sans Groq)
 * Fixtures Prisma seedées: project1 (COMPLETED), project2 (IN_PROGRESS)
 * A4 skippé : D-V13A-A4-NO-STABLE-SELECTOR (pas de data-testid, assertion tautologique)
 */

import { test, expect } from '@playwright/test';

test.describe('Admin — Reverse Engineering (V1.3-A)', () => {
  test('A1. /admin/reverse-engineering liste project1 et project2', async ({ page }) => {
    await page.goto('/admin/reverse-engineering');
    await expect(page).toHaveURL(/\/admin\/reverse-engineering/);
    await expect(
      page.getByText('Reverse engineering roulement SKF 6205', { exact: false }),
    ).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByText('Analyse engrenage module 2', { exact: false }),
    ).toBeVisible({ timeout: 20000 });
  });

  test('A2. project1 COMPLETED affiche le CadFile seedé SKF-6205-2RS.stl (onglet Dossier CAO)', async ({ page }) => {
    await page.goto('/admin/reverse-engineering');
    await page
      .getByText('Reverse engineering roulement SKF 6205', { exact: false })
      .first()
      .click();
    await page.waitForURL(/\/admin\/reverse-engineering\//, { timeout: 15000 });
    const tab = page.getByRole('tab', { name: /Dossier CAO/i });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(page.getByText('SKF-6205-2RS.stl', { exact: false })).toBeVisible({
      timeout: 20000,
    });
  });

  test('A3. project2 IN_PROGRESS — étapes: 4 complétées / 1 non complétée (Modélisation CAO)', async ({ page }) => {
    await page.goto('/admin/reverse-engineering');
    await page
      .getByRole('link', { name: /Analyse engrenage module 2/i })
      .first()
      .click();
    await page.waitForURL(/\/admin\/reverse-engineering\//, { timeout: 15000 });
    const tab = page.getByRole('tab', { name: /Étapes/i });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(page.getByText('Modélisation CAO', { exact: false })).toBeVisible({
      timeout: 20000,
    });
    await expect(
      page.getByText(/4 complétées\s*\/\s*1 non complétée/i, { exact: false }),
    ).toBeVisible({ timeout: 20000 });
  });

  // D-V13A-A4-NO-STABLE-SELECTOR — assertion tautologique, pas de data-testid,
  // skip en attente d'un sélecteur stable (V1.5)
  test.skip('A4. Déclencher "Analyser avec le Workspace" sur project1 et vérifier panneau résultat (sans preuve Groq)', async ({ page }) => {
    await page.goto('/admin/reverse-engineering');
    await page
      .getByText('Reverse engineering roulement SKF 6205', { exact: false })
      .first()
      .click();
    await page.waitForURL(/\/admin\/reverse-engineering\//, { timeout: 15000 });
    await expect(
      page.getByRole('button', { name: /Analyser avec le Workspace/i }),
    ).toBeVisible({ timeout: 20000 });
  });
});