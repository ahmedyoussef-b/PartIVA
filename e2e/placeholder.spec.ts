import { test, expect } from '@playwright/test';

/**
 * Tests E2E placeholder (E5-S02).
 *
 * Vérifient le mode placeholder : page /placeholder accessible,
 * landing publique maintenue, /api/health opérationnel, pages
 * publiques non redirigées. Exécutés en mode normal
 * (NEXT_PUBLIC_PLACEHOLDER_MODE=false) — le mode placeholder
 * activé est validé manuellement (nécessite un webServer dédié).
 *
 * Projet public (pas de storageState) — R.5.8.
 */

test.describe('Placeholder mode (E5-S02)', () => {
  test('page placeholder accessible', async ({ page }) => {
    await page.goto('/placeholder');
    await expect(page.getByText('En cours de développement')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /Retour à l'accueil/ })).toBeVisible();
  });

  test('landing accessible (toujours)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
  });

  test('/api/health retourne ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.status).toBe('ok');
    expect(json.timestamp).toBeDefined();
  });

  test('pages publiques accessibles (pas de redirect placeholder)', async ({ page }) => {
    for (const route of ['/services', '/contact', '/materiaux']) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).not.toContain('/placeholder');
    }
  });
});
