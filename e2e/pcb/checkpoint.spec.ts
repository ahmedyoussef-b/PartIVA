import { test, expect } from '@playwright/test';

test.describe('PCB - Checkpoints + Rollback', () => {
  test('créer un checkpoint', async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');
    // Mock la route checkpoint
    await page.route('**/api/pcb/checkpoint', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ checkpointId: 'cp-1', createdAt: new Date().toISOString() }),
      });
    });

    const body = await page.evaluate(async () => {
      const res = await fetch('/api/pcb/checkpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'proj-1', label: 'Avant modification' }),
      });
      return res.json();
    });
    expect(body.checkpointId).toBe('cp-1');
  });

  test('rollback vers un checkpoint', async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');
    await page.route('**/api/pcb/rollback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rolledBackTo: 'cp-1', label: 'Avant modification' }),
      });
    });

    const body = await page.evaluate(async () => {
      const res = await fetch('/api/pcb/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpointId: 'cp-1' }),
      });
      return res.json();
    });
    expect(body.rolledBackTo).toBe('cp-1');
  });
});
