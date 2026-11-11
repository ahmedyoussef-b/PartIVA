import { test, expect } from '@playwright/test';

test.describe('ADMIN - CRUD templates de pièces', () => {
  test.setTimeout(60000);

  const timestamp = Date.now();

  async function createTemplateViaUI(
    page: import('@playwright/test').Page,
    name: string,
    description: string,
  ) {
    await page.goto('/admin/part-templates/new');
    await expect(page.getByLabel(/Nom/i)).toBeVisible({ timeout: 30000 });
    await page.getByLabel(/Nom/i).fill(name);
    await page.getByLabel(/Description/i).fill(description);
    await page.getByRole('button', { name: /Créer le template/i }).click();
    await expect(page).toHaveURL(/\/admin\/part-templates($|\/[a-z0-9]+)/i, { timeout: 30000 });
  }

  async function deleteTemplateByName(page: import('@playwright/test').Page, name: string) {
    const row = page.locator('tr').filter({ hasText: name }).first();
    if ((await row.count()) === 0) {
      return;
    }
    const deleteBtn = row.locator('button:has-text("Supprimer")').first();
    if ((await deleteBtn.count()) === 0) {
      return;
    }
    await deleteBtn.click();
    await page.getByRole('button', { name: /Confirmer/i }).click();
    await expect(page).toHaveURL(/\/admin\/part-templates($|\/[a-z0-9]+)/i, { timeout: 30000 });
  }

  test('créer un template et vérifier sa présence dans la liste', async ({ page }) => {
    const name = `e2e-${timestamp}-create`;
    await createTemplateViaUI(page, name, 'Template E2E de création');
    await expect(page.getByText(name)).toBeVisible({ timeout: 10000 });
    await deleteTemplateByName(page, name);
  });

  test('lire un template depuis la liste', async ({ page }) => {
    const name = `e2e-${timestamp}-read`;
    await createTemplateViaUI(page, name, 'Template E2E de lecture');
    await page.goto('/admin/part-templates');
    await expect(page.getByText(name)).toBeVisible({ timeout: 10000 });
    await deleteTemplateByName(page, name);
  });

  test('mettre à jour un template', async ({ page }) => {
    const nameBefore = `e2e-${timestamp}-update-before`;
    const nameAfter = `e2e-${timestamp}-update-after`;
    await createTemplateViaUI(page, nameBefore, 'Avant mise à jour');
    const row = page.locator('tr').filter({ hasText: nameBefore }).first();
    await row.locator('a:has-text("Éditer")').first().click();
    await expect(page.getByLabel(/Nom/i)).toHaveValue(nameBefore);
    await page.getByLabel(/Nom/i).fill(nameAfter);
    await page.getByRole('button', { name: /Enregistrer/i }).click();
    await expect(page.getByLabel(/Nom/i)).toHaveValue(nameAfter);
    await page.goto('/admin/part-templates');
    await expect(page.getByText(nameAfter)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(nameBefore)).not.toBeVisible({ timeout: 10000 });
    await deleteTemplateByName(page, nameAfter);
  });

  test('supprimer un template', async ({ page }) => {
    const name = `e2e-${timestamp}-delete`;
    await createTemplateViaUI(page, name, 'Template à supprimer');
    await deleteTemplateByName(page, name);
    await expect(page.getByText(name)).not.toBeVisible({ timeout: 10000 });
  });
});
