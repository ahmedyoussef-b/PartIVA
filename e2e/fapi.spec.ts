// e2e/fapi.spec.ts
import { test, expect } from '@playwright/test';

test.describe('FAPI connector', () => {
  test('recherche w753 retourne des résultats réels', async ({ page }) => {
    await page.goto('/admin/recherche');

    // Adapte les sélecteurs aux data-testid réels de ton UI
    await page.fill('[data-testid="search-input"]', 'w753');
    await page.selectOption('[data-testid="source-select"]', 'fapi');
    await page.click('[data-testid="search-submit"]');

    // Attendre le premier résultat (FAPI peut être lent : 10s timeout min)
    const firstResult = page.locator('[data-testid="search-result"]').first();
    await expect(firstResult).toBeVisible({ timeout: 15000 });

    // Vérifier que la référence n'est pas vide
    const reference = await firstResult.getAttribute('data-reference');
    expect(reference).toBeTruthy();
  });
});
