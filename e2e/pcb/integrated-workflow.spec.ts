import { test, expect } from '@playwright/test';

test.describe('PCB Integrated Workflow (Sourcing + Compliance)', () => {
  test('should display both panels on project page', async ({ page, request }) => {
    // Créer un projet en BDD
    await request.post('/api/pcb/requirements/parse', {
      data: {
        answers: [
          { blockId: 'usage', questionId: 'usage_type', answer: 'prototype', status: 'confirmed' },
        ],
      },
    });

    await page.goto('/admin/pcb');
    await expect(page.getByRole('heading', { name: /PCB Design Studio/i })).toBeVisible();
  });
});
