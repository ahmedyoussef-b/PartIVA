import { test, expect } from '@playwright/test';

test.describe('PCB - Formulaire intelligent + Requirement Engine', () => {
  test('parcours complet : formulaire → validation → résumé', async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');

    // Bloc 1
    await expect(page.getByText(/Contexte d'usage/i)).toBeVisible();
    await page.getByRole('combobox').first().selectOption('prototype');
    await page.getByRole('textbox').first().fill('0-40°C');
    await page.getByRole('button', { name: /Suivant/i }).click();

    // Bloc 2
    await expect(page.getByText(/Fonctions principales/i)).toBeVisible();
    await page.getByRole('textbox').first().fill('Mesurer la température');
    await page.getByRole('button', { name: /Suivant/i }).click();

    // Naviguer jusqu'au dernier bloc
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /Suivant/i }).click();
    }

    // Bloc 7 (récapitulatif)
    await expect(page.getByText(/Récapitulatif/i)).toBeVisible();
    await page.getByRole('button', { name: /Valider le cahier des charges/i }).click();
  });

  test("détection d'incohérence : 3.3V + capteur", async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');

    // Bloc 1
    await page.getByRole('combobox').first().selectOption('industriel');
    await page.getByRole('textbox').first().fill('0-40°C');
    await page.getByRole('button', { name: /Suivant/i }).click();

    // Bloc 2 : capteur + 3.3V
    await page.getByRole('textbox').first().fill('mesure');
    await page.getByRole('button', { name: /Suivant/i }).click();

    // Vérifier qu'une incohérence est détectée
    await expect(page.getByText(/Incohérences détectées/i)).toBeVisible();
  });
});
