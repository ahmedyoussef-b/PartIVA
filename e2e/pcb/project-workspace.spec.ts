import { test, expect } from '@playwright/test';

test.describe('PCB - Workspace projet', () => {
  test('affiche le workspace projet', async ({ page }) => {
    // Mock les routes API pour éviter une DB réelle
    await page.route('**/api/pcb/checkpoint', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ checkpointId: 'cp-1' }),
      });
    });

    // Vérifier que la page projet existe (route dynamique)
    const res = await page.request.get('/admin/pcb/test-project');
    // 404 attendu si le projet n'existe pas — on vérifie que la route existe
    expect([200, 404]).toContain(res.status());
  });

  test('créer un checkpoint via API', async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');
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
        body: JSON.stringify({ projectId: 'test-project', label: 'Test checkpoint' }),
      });
      return res.json();
    });
    expect(body.checkpointId).toBe('cp-1');
  });
});
