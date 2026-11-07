// e2e/fapi.spec.ts
import { test, expect } from '@playwright/test';

test.describe('FAPI connector', () => {
  test('recherche w753 retourne des résultats réels', async ({ page }) => {
    await page.goto('/admin/recherche');

    await page.fill('[data-testid="search-input"]', 'w753');
    await page.selectOption('[data-testid="source-select"]', 'fapi');

    // Attendre la réponse réseau au lieu de cliquer aveugle
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/search') && res.url().includes('source=fapi'),
    );
    await page.click('[data-testid="search-submit"]');
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Attendre le premier résultat (FAPI peut être lent : 10s timeout min)
    const firstResult = page.locator('[data-testid="search-result"]').first();
    await expect(firstResult).toBeVisible({ timeout: 15000 });

    // Vérifier que la référence n'est pas vide
    const reference = await firstResult.getAttribute('data-reference');
    expect(reference).toBeTruthy();
  });
});
