import { test, expect } from '@playwright/test';

test.describe('PCB - Soumission formulaire', () => {
  test("le bouton Valider appelle l'API et redirige", async ({ page }) => {
    let apiCalled = false;
    await page.route('**/api/pcb/requirements/parse', async (route) => {
      apiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ projectId: 'proj-123', formId: 'form-1', answerCount: 2 }),
      });
    });

    await page.goto('/admin/pcb/nouveau');

    // Bloc 1
    await page.getByTestId('select-usage_type').selectOption('prototype');
    await page.getByTestId('input-temp_range').fill('0-40°C');
    await page.getByRole('button', { name: /Suivant/i }).click();

    // Bloc 2
    await page.getByTestId('input-main_functions').fill('Mesurer');
    await page.getByRole('button', { name: /Suivant/i }).click();

    // Naviguer jusqu'au dernier bloc (4 clics)
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /Suivant/i }).click();
    }

    // Cliquer Valider
    await page.getByRole('button', { name: /Valider le cahier des charges/i }).click();

    // Vérifier que l'API a été appelée
    expect(apiCalled).toBe(true);

    // Vérifier la redirection vers /admin/pcb/proj-123
    await page.waitForURL('**/admin/pcb/proj-123');
    expect(page.url()).toContain('/admin/pcb/proj-123');
  });
});
