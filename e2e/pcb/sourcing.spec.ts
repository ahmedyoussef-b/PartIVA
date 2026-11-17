import { test, expect } from '@playwright/test';

test.describe('PCB - Sourcing BOM', () => {
  test('recherche un composant', async ({ page }) => {
    await page.goto('/admin/pcb');
    const res = await page.request.post('/api/pcb/sourcing', {
      data: { action: 'search', query: 'résistance' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.results).toBeInstanceOf(Array);
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results[0]).toHaveProperty('supplierRef');
    expect(body.results[0]).toHaveProperty('price');
  });

  test('calcule le coût BOM', async ({ page }) => {
    await page.goto('/admin/pcb');
    const res = await page.request.post('/api/pcb/sourcing', {
      data: {
        action: 'bomCost',
        components: [
          { name: 'Résistance 10kΩ 0603', quantity: 10 },
          { name: 'Condensateur 100nF 0603', quantity: 5 },
        ],
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.total).toBeGreaterThan(0);
    expect(body.components).toHaveLength(2);
    expect(body.currency).toBe('EUR');
  });

  test('trouve des alternatives', async ({ page }) => {
    await page.goto('/admin/pcb');
    const res = await page.request.post('/api/pcb/sourcing', {
      data: { action: 'alternatives', componentId: 'r-10k-0603' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.alternatives).toBeInstanceOf(Array);
  });

  test('gère un composant manquant', async ({ page }) => {
    await page.goto('/admin/pcb');
    const res = await page.request.post('/api/pcb/sourcing', {
      data: {
        action: 'bomCost',
        components: [{ name: 'Composant inexistant', quantity: 1 }],
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.missing).toContain('Composant inexistant');
  });
});
