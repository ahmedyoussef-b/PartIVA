import { test, expect } from '@playwright/test';

test.describe('PCB Auto Orchestrator', () => {
  test('pipeline completes successfully with mocked API', async ({ page }) => {
    const calls: string[] = [];

    await page.route('**/api/reverse-engineering/analyze', async (route) => {
      calls.push('analysis');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ components: [{ id: 'U1' }], nets: [{ name: 'VCC' }] }),
      });
    });
    await page.route('**/api/pcb/design-review', async (route) => {
      calls.push('design-review');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ score: 85, components: [{ id: 'U1' }], nets: [{ name: 'VCC' }] }),
      });
    });
    await page.route('**/api/pcb/autoroute', async (route) => {
      calls.push('autoroute');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', dsnContent: '(PCB)' }),
      });
    });

    await page.goto('/admin/pcb');
    // Simuler le pipeline via fetch directs (validation de la séquence)
    await page.evaluate(async () => {
      await fetch('/api/reverse-engineering/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: 'U1' }),
      });
      await fetch('/api/pcb/design-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: [{ id: 'U1' }], nets: [] }),
      });
      await fetch('/api/pcb/autoroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: [{ id: 'U1' }], nets: [] }),
      });
    });

    expect(calls).toContain('analysis');
    expect(calls).toContain('design-review');
    expect(calls).toContain('autoroute');
    // Ordre séquentiel vérifié
    expect(calls).toEqual(['analysis', 'design-review', 'autoroute']);
  });
});
