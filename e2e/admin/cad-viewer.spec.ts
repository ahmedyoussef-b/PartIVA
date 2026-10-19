import { test, expect } from '@playwright/test';

test.describe('E16-R1 — CadViewer STEP (occt-import-js)', () => {
  test('charge la fixture STEP et rend un canvas WebGL', async ({ page }) => {
    await page.goto('/admin/3d-test', { waitUntil: 'networkidle' });

    // Le parsing STEP passe par un Web Worker : le conteneur canvas doit apparaître.
    await expect(page.getByTestId('cad-viewer-canvas')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('cad-viewer-error')).toHaveCount(0);
  });

  test('affiche une erreur explicite pour une fixture STEP invalide', async ({ page }) => {
    // La fixture est interceptée pour renvoyer un contenu STEP corrompu.
    await page.route('**/models/test.step', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        body: 'not-a-step-file',
      }),
    );

    await page.goto('/admin/3d-test', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('cad-viewer-error')).toBeVisible({ timeout: 60_000 });
  });

  test('le worker WASM est servi avec le bon chemin public', async ({ page, request }) => {
    const resp = await request.get('/wasm/occt-import-js-worker.js');
    expect(resp.status()).toBe(200);

    const wasm = await request.get('/wasm/occt-import-js.wasm');
    expect(wasm.status()).toBe(200);
  });
});
