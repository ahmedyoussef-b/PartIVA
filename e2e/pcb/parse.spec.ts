import { test, expect } from '@playwright/test';

test.describe('PCB - Parser ERC/DRC', () => {
  test('parseErcReport retourne une structure valide', async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');
    const mockJson = JSON.stringify({
      violations: [
        { severity: 'error', message: 'Unconnected pin', location: 'U1-A3' },
        { severity: 'warning', message: 'Missing decoupling cap', location: 'U1-VCC' },
      ],
    });

    const res = await page.request.post('/api/pcb/parse', {
      data: { action: 'parseErc', json: mockJson },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('violations');
    expect(body).toHaveProperty('counts');
    expect(body.counts.error).toBe(1);
    expect(body.counts.warning).toBe(1);
    expect(body.success).toBe(false);
  });

  test('parseDrcReport retourne une structure valide', async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');
    const mockJson = JSON.stringify({
      violations: [{ severity: 'error', message: 'Clearance violation', location: 'R1-C1' }],
    });

    const res = await page.request.post('/api/pcb/parse', {
      data: { action: 'parseDrc', json: mockJson },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.counts.error).toBe(1);
    expect(body.success).toBe(false);
  });

  test('parseErcReport gère un JSON invalide', async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');
    const res = await page.request.post('/api/pcb/parse', {
      data: { action: 'parseErc', json: 'not-json' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.counts.error).toBe(0);
  });
});
