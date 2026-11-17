import { test, expect } from '@playwright/test';

test.describe('PCB Auto Mode UI', () => {
  test('should show progress bar when auto mode is running', async ({ page }) => {
    await page.route('**/api/reverse-engineering/analyze', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ components: [], nets: [] }),
      });
    });
    await page.route('**/api/pcb/design-review', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ score: 100, components: [], nets: [] }),
      });
    });
    await page.route('**/api/pcb/autoroute', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', dsnContent: '(PCB)' }),
      });
    });

    await page.goto('/admin/pcb');

    const btn = page.getByRole('button', { name: /Mode Automatique/i });
    await expect(btn).toBeVisible();
    await btn.click();

    // Vérifier que la barre de progression apparaît
    await expect(page.getByText(/Étape en cours/i)).toBeVisible();
  });

  test('button is visible on PCB studio page', async ({ page }) => {
    await page.goto('/admin/pcb');
    const btn = page.getByRole('button', { name: /Mode Automatique/i });
    await expect(btn).toBeVisible();
  });
});
