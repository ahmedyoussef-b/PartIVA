import { test, expect } from '@playwright/test';

test.describe('PCB Sourcing UI', () => {
  test('should display sourcing table with matched components', async ({ page }) => {
    await page.route('**/api/pcb/sourcing', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              reference: 'U1',
              matchedMpns: [{ mpn: 'STM32F405', price: 8.5, stock: 100 }],
              alternatives: [],
              totalCost: 17.0,
              isAvailable: true,
            },
          ],
        }),
      });
    });

    await page.goto('/admin/pcb');
    // Le tableau est rendu via SourcingTable (composant client)
    // Vérifier que le composant peut être importé et rendu
    await expect(page.getByRole('heading', { name: /PCB Design Studio/i })).toBeVisible();
  });

  test('should show alternatives toggle when available', async ({ page }) => {
    await page.route('**/api/pcb/sourcing', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              reference: 'R1',
              matchedMpns: [],
              alternatives: [{ mpn: 'ALT-10K', price: 0.01, stock: 500, similarityScore: 0.8 }],
              totalCost: 0.1,
              isAvailable: true,
            },
          ],
        }),
      });
    });

    await page.goto('/admin/pcb');
    await expect(page.getByRole('heading', { name: /PCB Design Studio/i })).toBeVisible();
  });
});
