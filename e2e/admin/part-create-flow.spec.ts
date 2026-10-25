import { test, expect } from '@playwright/test';

test.describe('ADMIN - Flux complet de création de pièce', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/pieces/nouveau');
    await expect(page.getByLabel(/Numéro de pièce/i)).toBeVisible({ timeout: 30000 });
  });

  test('créer une pièce avec image et vérifier sa présence dans le catalogue', async ({ page }) => {
    const uniquePartNumber = `TEST-${Date.now()}`;
    const partName = 'Vis M8 Test Automation';
    const imagePath = 'e2e/fixtures/test-part.jpg';

    await page.getByLabel(/Numéro de pièce/i).fill(uniquePartNumber);
    await page.getByLabel(/^Nom$/i).fill(partName);
    await page
      .getByLabel(/Description/i)
      .fill('Pièce créée automatiquement pour valider le flux E2E.');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(imagePath);

    await expect(page.getByText(/1 photo chargée|photo\(s\) chargée\(s\)/i)).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole('button', { name: /Créer la pièce/i }).click();

    await expect(page).toHaveURL(/\/admin\/pieces($|\/[a-z0-9]+)/i, { timeout: 30000 });

    if (page.url().endsWith('/admin/pieces')) {
      await expect(page.getByText(uniquePartNumber)).toBeVisible({ timeout: 10000 });
    } else {
      const imagesTab = page.getByRole('tab', { name: /Images/i });
      if (await imagesTab.isVisible()) {
        await imagesTab.click();
        await expect(page.locator('img[src*="cloudinary"]').first()).toBeVisible({
          timeout: 10000,
        });
      }
    }
  });
});
