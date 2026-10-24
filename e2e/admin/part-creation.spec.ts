import { test, expect } from '@playwright/test';
import { users } from '../fixtures/users';
import { accessMatrix } from '../fixtures/access-matrix';

/**
 * E20-Fix6/7 — Tests E2E : création de pièce avec upload et onglet Images.
 *
 * Scénario :
 * 1. Se connecter en ADMIN
 * 2. Aller sur /admin/pieces/nouveau
 * 3. Remplir le formulaire (Numéro, Nom, Description)
 * 4. Uploader une image via input file
 * 5. Soumettre la demande
 * 6. Vérifier la redirection et l'onglet "Images" sur la fiche
 */

const staticPieceRoutes = accessMatrix.filter((r) => r.dynamicId === undefined);

for (const route of staticPieceRoutes) {
  if (route.ADMIN !== 'ALLOW') continue;

  test.describe(`ADMIN création pièce — ${route.path}`, () => {
    test('créer une pièce et voir l\'onglet Images avec l\'image uploadée', async ({
      page,
      request,
    }) => {
      // 1. Se connecter en ADMIN
      const admin = users.ADMIN;
      await page.goto('/login');
      await page.getByRole('textbox', { name: /email/i }).fill(admin.email);
      await page.getByRole('textbox', { name: /mot de passe/i }).fill(admin.password);
      await page.getByRole('button', { name: /se connecter/i }).click();
      await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

      // 2. Aller sur la page création
      await page.goto('/admin/pieces/nouveau');
      await expect(page.getByRole('heading', { name: /nouvelle pièce/i })).toBeVisible();

      // 3. Remplir le formulaire
      await page.getByRole('textbox', { name: /numéro/i }).fill('TEST-001');
      await page.getByRole('textbox', { name: /nom/i }).fill('Pièce de test E2E');
      await page.getByRole('textbox', { name: /description/i }).fill('Description de test');

      // 4. Upload d'image
      const fileInput = page.locator('input[type=file]');
      const testImagePath = 'e2e/fixtures/test-part.jpg';
      const fileChooserPromise = page.waitForEvent('filechooser');
      await fileInput.setInputFiles(testImagePath);
      const fileChooser = await fileChooserPromise;
      await fileChooser.accept(['e2e/fixtures/test-part.jpg']);

      // 5. Soumettre
      await page.getByRole('button', { name: /soumettre/i }).click();

      // 6. Vérifier la redirection vers la liste
      await expect(page).toHaveURL(/\/admin\/pieces$/, { timeout: 30_000 });
      await expect(page.getByText(/pièce de test/i)).toBeVisible();

      // 7. Cliquer sur la pièce pour ouvrir le détail
      await page.getByText(/pièce de test/i).first().click();
      await expect(page).toHaveURL(/\/admin\/pieces\//, { timeout: 30_000 });

      // 8. Vérifier l'onglet "Images" est présent
      await expect(page.getByRole('tab', { name: /images/i })).toBeVisible();

      // 9. Aller sur l'onglet Images et vérifier l'image
      await page.getByRole('tab', { name: /images/i }).click();
      await expect(page.getByText(/image téléchargée/i)).toBeVisible();
    });
  });
}
