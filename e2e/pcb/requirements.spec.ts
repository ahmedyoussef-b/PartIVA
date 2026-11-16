import { test, expect } from '@playwright/test';

test.describe('PCB - Formulaire intelligent + Requirement Engine', () => {
  test('parcours complet : formulaire → validation → résumé', async ({ page }) => {
    await page.route('**/api/pcb/requirements/parse', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ projectId: 'proj-123', formId: 'form-1', answerCount: 2 }),
      });
    });

    await page.goto('/admin/pcb/nouveau');

    // Bloc 1
    await expect(page.getByTestId('block-title')).toContainText(/Contexte d'usage/i);
    await page.getByTestId('select-usage_type').selectOption('prototype');
    await page.getByTestId('input-temp_range').fill('0-40°C');
    await page.getByRole('button', { name: /Suivant/i }).click();

    // Bloc 2
    await expect(page.getByTestId('block-title')).toContainText(/Fonctions principales/i);
    await page.getByTestId('input-main_functions').fill('Mesurer la température');
    await page.getByRole('button', { name: /Suivant/i }).click();

    // Naviguer jusqu'au dernier bloc
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /Suivant/i }).click();
    }

    // Bloc 7 (récapitulatif)
    await expect(page.getByText(/Récapitulatif/i)).toBeVisible();
    await page.getByRole('button', { name: /Valider le cahier des charges/i }).click();

    // Vérifier la redirection vers le projet créé
    await page.waitForURL('**/admin/pcb/proj-123');
  });

  test("détection d'incohérence : 3.3V + capteur", async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');

    // Bloc 1
    await page.getByTestId('select-usage_type').selectOption('industriel');
    await page.getByTestId('input-temp_range').fill('0 à 40°C');
    await page.getByRole('button', { name: /Suivant/i }).click();

    // Bloc 2 : capteur + 3.3V
    await page.getByTestId('input-main_functions').fill('mesure');
    await page.getByRole('button', { name: /Suivant/i }).click();

    // Vérifier qu'une incohérence est détectée
    await expect(page.getByText(/Incohérences détectées/i)).toBeVisible();
  });
});
