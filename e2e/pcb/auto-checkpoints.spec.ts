import { test, expect } from '@playwright/test';

test.describe('Auto Pipeline Checkpoints', () => {
  test('should persist checkpoint on each step completion', async ({ page }) => {
    let checkpointCalls = 0;
    await page.route('**/api/pcb/checkpoint', async (route) => {
      checkpointCalls++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ checkpointId: 'cp-1' }),
      });
    });
    await page.route('**/api/reverse-engineering/analyze', async (route) => {
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
    await btn.click();

    // Attendre que le pipeline se termine (3 étapes × 2 checkpoints = 6 appels)
    await page.waitForTimeout(3000);
    expect(checkpointCalls).toBeGreaterThanOrEqual(3);
  });
});
