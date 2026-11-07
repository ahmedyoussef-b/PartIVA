import { test, expect } from '@playwright/test';

/**
 * V5-D — E2E Multi-Sources
 * Vérifie que l'UI est branchée sur aggregateSearch (V5-A)
 * et que le connecteur geometric (V5-B) est bien exécuté.
 */
test.describe('Recherche Multi-Sources (V5)', () => {
  test('doit interroger toutes les sources dont geometric', async ({ page }) => {
    // 1. Récupérer dynamiquement un ID de demande via l'API
    const apiResponse = await page.request.get('/api/requests');
    expect(apiResponse.ok()).toBeTruthy();
    const requests = await apiResponse.json();

    // On cherche une demande valide (le premier ID disponible)
    const requestId = requests?.[0]?.id;
    expect(requestId).toBeDefined();

    // 2. Naviguer directement vers la page de recherche multi-sources
    await page.goto(`/admin/demandes/${requestId}/recherche`);

    // 3. Attendre que la page soit chargée (titre visible)
    await expect(page.getByRole('heading', { name: /Recherche Multi-Sources/i })).toBeVisible();

    // 4. Préparer l'interception du POST /api/search
    const searchResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/search') && res.request().method() === 'POST',
      { timeout: 30_000 },
    );

    // 5. Cliquer sur "Lancer la Recherche"
    await page.getByRole('button', { name: /lancer la recherche/i }).click();

    // 6. Récupérer la réponse réseau
    const response = await searchResponsePromise;
    expect(response.status()).toBe(200);

    const body = await response.json();

    // 7. VÉRIFICATION V5-B : geometric est interrogé
    expect(body.sourcesQueried).toContain('geometric');

    // 8. VÉRIFICATION V5-A : les sources sont remplies
    expect(body.sourceDurationsMs).toBeDefined();
    expect(Object.keys(body.sourceDurationsMs).length).toBeGreaterThan(0);

    // 9. VÉRIFICATION UI : le panneau "Sources de Recherche" est visible
    await expect(page.getByText('Sources de Recherche')).toBeVisible();

    // 10. VÉRIFICATION UI : l'onglet "Tous" contient un compteur
    await expect(page.getByRole('tab', { name: /tous/i })).toBeVisible();
  });
});
