import { test, expect } from '@playwright/test';

test.describe('PCB - Statut KiCad', () => {
  test('affiche le statut KiCad (déconnecté)', async ({ page }) => {
    await page.route('**/api/pcb/ipc', async (route) => {
      const body = route.request().postDataJSON();
      if (body.action === 'detect') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ available: false, socketPath: null, version: null }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/pcb');
    await expect(page.getByText(/KiCad GUI non détecté/i)).toBeVisible();
  });

  test('affiche le statut KiCad (connecté)', async ({ page }) => {
    await page.route('**/api/pcb/ipc', async (route) => {
      const body = route.request().postDataJSON();
      if (body.action === 'detect') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            available: true,
            socketPath: '/tmp/kicad/api123.sock',
            version: '10.0.8',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/pcb');
    await expect(page.getByText(/KiCad GUI connecté/i)).toBeVisible();
    await expect(page.getByText(/10.0.8/)).toBeVisible();
  });

  test('affiche le tableau de bord PCB', async ({ page }) => {
    await page.route('**/api/pcb/ipc', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ available: false, socketPath: null, version: null }),
      });
    });

    await page.goto('/admin/pcb');
    await expect(page.getByRole('heading', { name: /PCB Design Studio/i })).toBeVisible();
    await expect(page.getByText(/Nouveau projet/i)).toBeVisible();
    await expect(page.getByText(/Bibliothèque/i)).toBeVisible();
  });
});
