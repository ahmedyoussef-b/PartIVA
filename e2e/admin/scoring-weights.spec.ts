import { test, expect } from '@playwright/test';

/**
 * Tests UI poids de scoring (E4-S04, D-scoring-weights-ui).
 *
 * Le tableau des poids (ScoringWeightsTable) est affiché
 * dans Paramètres → Scoring (admin uniquement, read-only).
 * Les poids proviennent de src/lib/scoring/weights.ts.
 */

test.describe('Scoring weights UI (E4-S04)', () => {
  test('tableau des poids affiché (section Scoring, admin)', async ({ page }) => {
    await page.goto('/admin/parametres');

    await page.getByRole('button', { name: 'Scoring' }).click();

    await expect(page.getByText('Poids de scoring des sources')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText('local_db')).toBeVisible();
    await expect(page.getByText('wikidata')).toBeVisible();
    await expect(page.getByText('traceparts')).toBeVisible();
  });

  test('tableau read-only (aucun champ de saisie numérique)', async ({ page }) => {
    await page.goto('/admin/parametres');

    await page.getByRole('button', { name: 'Scoring' }).click();

    await expect(page.getByText('Poids de scoring des sources')).toBeVisible();
    const numberInputs = page.locator('input[type="number"]');
    await expect(numberInputs).toHaveCount(0);
    await expect(page.getByText('Lecture seule')).toBeVisible();
  });

  test('poids et timeouts affichés pour les 3 sources', async ({ page }) => {
    await page.goto('/admin/parametres');

    await page.getByRole('button', { name: 'Scoring' }).click();

    await expect(page.getByText('Poids de scoring des sources')).toBeVisible();
    await expect(page.getByText('1.0').first()).toBeVisible();
    await expect(page.getByText('0.8').first()).toBeVisible();
    await expect(page.getByText('0.6').first()).toBeVisible();
    await expect(page.getByText('2 s').first()).toBeVisible();
    await expect(page.getByText('10 s').first()).toBeVisible();
    await expect(page.getByText('3 s').first()).toBeVisible();
  });
});
