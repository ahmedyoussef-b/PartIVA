import { test, expect } from '@playwright/test';

test.describe('PCB Design Review UI', () => {
  test('should display blocker findings when present', async ({ page, request }) => {
    // Créer un projet
    const createRes = await request.post('/api/pcb/requirements/parse', {
      data: {
        answers: [
          { blockId: 'usage', questionId: 'usage_type', answer: 'prototype', status: 'confirmed' },
        ],
      },
    });
    const { projectId } = await createRes.json();

    await page.route('**/api/pcb/design-review/run', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          findings: [
            {
              ruleId: 'DR-002',
              severity: 'BLOCKER',
              message: 'Référence dupliquée R1',
              location: 'R1',
              suggestion: 'Annoter correctement',
            },
          ],
          summary: { blocker: 1, major: 0, minor: 0, info: 0, total: 1 },
          isPassable: false,
          checkedRules: 3,
        }),
      });
    });

    await page.goto(`/admin/pcb/${projectId}`);
    await page.getByRole('button', { name: /Lancer la revue/i }).click();

    await expect(page.getByText(/1 bloqueur/i)).toBeVisible();
    await expect(page.getByText('DR-002')).toBeVisible();
    await expect(page.getByText('Référence dupliquée R1')).toBeVisible();
  });

  test('should show pass state when no blockers', async ({ page, request }) => {
    // Créer un projet
    const createRes = await request.post('/api/pcb/requirements/parse', {
      data: {
        answers: [
          { blockId: 'usage', questionId: 'usage_type', answer: 'prototype', status: 'confirmed' },
        ],
      },
    });
    const { projectId } = await createRes.json();

    await page.route('**/api/pcb/design-review/run', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          findings: [],
          summary: { blocker: 0, major: 0, minor: 0, info: 0, total: 0 },
          isPassable: true,
          checkedRules: 3,
        }),
      });
    });

    await page.goto(`/admin/pcb/${projectId}`);
    await page.getByRole('button', { name: /Lancer la revue/i }).click();

    await expect(page.getByText('Revue validée')).toBeVisible();
  });
});
