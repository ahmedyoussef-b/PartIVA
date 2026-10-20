import { test, expect } from '@playwright/test';

test.describe('E16-R1 — CadViewer STEP (occt-import-js)', () => {
  test('charge la fixture STEP et rend un canvas WebGL', async ({ page }) => {
    await page.goto('/admin/3d-test', { waitUntil: 'networkidle' });

    // Le parsing STEP passe par un Web Worker : le conteneur canvas doit apparaître.
    await expect(page.getByTestId('cad-viewer-canvas')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('cad-viewer-error')).toHaveCount(0);
  });

  test('affiche une erreur détaillée pour une fixture STEP invalide', async ({ page }) => {
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
    // E16-R2 : le message doit contenir le détail OCCT
    await expect(page.getByTestId('cad-viewer-error')).toContainText(
      /StepFile|Parsing|invalide|Délai/i,
    );
  });

  test('le worker WASM est servi avec le bon chemin public', async ({ page, request }) => {
    const resp = await request.get('/wasm/occt-import-js-worker.js');
    expect(resp.status()).toBe(200);

    const wasm = await request.get('/wasm/occt-import-js.wasm');
    expect(wasm.status()).toBe(200);
  });
});

test.describe('E16-R2 — CadViewer robustesse (timeout)', () => {
  test('Timeout propre : erreur après timeoutMs configuré', async ({ page }) => {
    // La page /admin/3d-test-timeout utilise timeoutMs={2000}.
    // On retarde la réponse de 5s pour forcer le timeout à 2s.
    await page.route('**/models/test.step', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.fulfill({ status: 200, body: 'delayed' });
    });

    await page.goto('/admin/3d-test-timeout', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('cad-viewer-error')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('cad-viewer-error')).toContainText(/Délai|Échec|parsing/i);
  });
});

test.describe('E16-R2 — CadViewer IGES (occt-import-js)', () => {
  test('charge la fixture IGES et rend un canvas WebGL', async ({ page }) => {
    await page.goto('/admin/3d-test-iges', { waitUntil: 'networkidle' });

    // Le parsing IGES passe par un Web Worker : le conteneur canvas doit apparaître.
    await expect(page.getByTestId('cad-viewer-canvas')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('cad-viewer-error')).toHaveCount(0);
  });

  test('affiche une erreur détaillée pour une fixture IGES invalide', async ({ page }) => {
    // La fixture est interceptée pour renvoyer un contenu IGES corrompu.
    await page.route('**/models/test.iges', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        body: 'not-an-iges-file',
      }),
    );

    await page.goto('/admin/3d-test-iges', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('cad-viewer-error')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('cad-viewer-error')).toContainText(
      /IgesFile|Parsing|invalide|Délai/i,
    );
  });
});
