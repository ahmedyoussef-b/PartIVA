import { test, expect } from '@playwright/test';

test.describe('PCB - Bibliothèque de composants', () => {
  test('affiche la bibliothèque', async ({ page }) => {
    await page.goto('/admin/pcb/bibliotheque');
    await expect(page.getByRole('heading', { name: /Bibliothèque de composants/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Rechercher un composant/i)).toBeVisible();
  });

  test('édite un prix', async ({ page }) => {
    await page.goto('/admin/pcb/bibliotheque');
    const editButtons = page.getByRole('button', { name: /Éditer prix/i });
    const count = await editButtons.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await editButtons.first().click();
    await page.getByRole('spinbutton').fill('1.50');
    await page.getByRole('button', { name: /Enregistrer/i }).click();
    await expect(page.getByText('1.50')).toBeVisible();
  });
});
