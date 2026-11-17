import { test, expect } from '@playwright/test';

test.describe('PCB - Revue de conception', () => {
  test('détecte les footprints manquants', async ({ page }) => {
    await page.goto('/admin/pcb');
    const res = await page.request.post('/api/pcb/design-review', {
      data: {
        components: [{ id: 'c1', reference: 'U1', name: 'STM32', footprint: undefined }],
        nets: [{ id: 'n1', name: 'VCC', pins: [] }],
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.findings.some((f: { category: string }) => f.category === 'footprint')).toBe(true);
  });

  test('détecte les références non annotées', async ({ page }) => {
    await page.goto('/admin/pcb');
    const res = await page.request.post('/api/pcb/design-review', {
      data: {
        components: [{ id: 'c1', reference: '?', name: 'Résistance', footprint: 'R_0603' }],
        nets: [{ id: 'n1', name: 'VCC', pins: [] }],
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.findings.some((f: { category: string }) => f.category === 'reference')).toBe(true);
  });

  test("détecte l'absence de power-rail", async ({ page }) => {
    await page.goto('/admin/pcb');
    const res = await page.request.post('/api/pcb/design-review', {
      data: {
        components: [{ id: 'c1', reference: 'U1', name: 'STM32', footprint: 'QFP48' }],
        nets: [{ id: 'n1', name: 'SIG', pins: [] }],
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.findings.some((f: { category: string }) => f.category === 'power_rail')).toBe(true);
  });

  test('calcule un score', async ({ page }) => {
    await page.goto('/admin/pcb');
    const res = await page.request.post('/api/pcb/design-review', {
      data: {
        components: [{ id: 'c1', reference: 'U1', name: 'STM32', footprint: 'QFP48' }],
        nets: [{ id: 'n1', name: 'VCC', pins: [] }],
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.score).toBeGreaterThanOrEqual(0);
    expect(body.score).toBeLessThanOrEqual(100);
    expect(body.summary).toHaveProperty('errors');
  });
});
