import { test, expect } from '@playwright/test';

test.describe('PCB - EDA Adapter (kicad-cli)', () => {
  test('détecte kicad-cli', async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');
    const res = await page.request.post('/api/pcb/eda', {
      data: { action: 'detect' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // kicad-cli peut être présent ou absent — on vérifie que la route répond
    expect(body).toHaveProperty('available');
  });

  test('ERC retourne une structure valide', async ({ page }) => {
    await page.goto('/admin/pcb/nouveau');
    // Mock la route pour éviter un appel réel à kicad-cli
    await page.route('**/api/pcb/eda', async (route) => {
      const body = route.request().postDataJSON();
      if (body.action === 'erc') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, stdout: '', stderr: '', exitCode: 0 }),
        });
      } else {
        await route.continue();
      }
    });

    const res = await page.request.post('/api/pcb/eda', {
      data: { action: 'erc', inputPath: 'test.kicad_sch' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('success');
    expect(body).toHaveProperty('exitCode');
  });
});
