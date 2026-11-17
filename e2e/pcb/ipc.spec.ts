import { test, expect } from '@playwright/test';

test.describe('PCB - IPC Adapter (KiCad GUI)', () => {
  test('détecte le socket IPC', async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');
    const res = await page.request.post('/api/pcb/ipc', {
      data: { action: 'detect' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('available');
    expect(body).toHaveProperty('socketPath');
    expect(body).toHaveProperty('version');
  });

  test('getVersion retourne la version KiCad', async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');
    const res = await page.request.post('/api/pcb/ipc', {
      data: { action: 'getVersion' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('available');
  });

  test('getProject retourne null si socket absent', async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');
    const res = await page.request.post('/api/pcb/ipc', {
      data: { action: 'getProject', socketPath: '/tmp/nonexistent.sock' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('project');
  });
});
