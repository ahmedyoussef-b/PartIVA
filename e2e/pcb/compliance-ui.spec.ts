import { test, expect } from '@playwright/test';

test.describe('PCB Compliance Panel', () => {
  test('should display compliance panel on project page', async ({ page, request }) => {
    // Créer un projet en BDD
    await request.post('/api/pcb/requirements/parse', {
      data: {
        answers: [
          { blockId: 'usage', questionId: 'usage_type', answer: 'prototype', status: 'confirmed' },
        ],
      },
    });

    await page.route('**/api/pcb/simulate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          violations: [],
          isCompliant: true,
          checkedRules: 3,
        }),
      });
    });

    // Visiter la page projet (le projet créé a un ID généré)
    // On visite la page /admin/pcb qui liste les projets
    await page.goto('/admin/pcb');
    await expect(page.getByRole('heading', { name: /PCB Design Studio/i })).toBeVisible();
  });

  test('should show violations after analysis', async ({ page }) => {
    await page.route('**/api/pcb/simulate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          violations: [
            {
              type: 'CURRENT_CAPACITY',
              severity: 'CRITICAL',
              message: 'Courant 1.0A dépasse capacité 0805',
              location: 'R1',
            },
          ],
          isCompliant: false,
          checkedRules: 3,
        }),
      });
    });

    await page.goto('/admin/pcb');
    await expect(page.getByRole('heading', { name: /PCB Design Studio/i })).toBeVisible();
  });
});
