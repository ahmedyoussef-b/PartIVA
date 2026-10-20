import { test, expect } from '@playwright/test';

test.describe('E17-R4 — Dashboard (fix fetch)', () => {
  test('le dashboard charge sans erreur de parsing', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });

    // Le dashboard doit afficher son contenu (pas de "Chargement..." infini)
    await expect(page.getByText('Chargement...')).toHaveCount(0, { timeout: 30_000 });

    // Le dashboard doit afficher les KPI (même vides)
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('le dashboard ne log pas de SyntaxError', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('SyntaxError')) {
        errors.push(msg.text());
      }
    });

    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    expect(errors).toHaveLength(0);
  });
});
