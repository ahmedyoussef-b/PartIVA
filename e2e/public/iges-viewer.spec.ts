import { test, expect } from '@playwright/test';

test.describe('E16-R2 — CadViewer IGES (public)', () => {
  test('charge la fixture IGES et rend un canvas WebGL', async ({ page }) => {
    // Cold start : compilation de la route + WASM OCCT (7,6 Mo) + parsing.
    test.setTimeout(120_000);
    await page.goto('/test/iges-viewer', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('cad-viewer-canvas')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('cad-viewer-error')).toHaveCount(0);
  });

  test('affiche une erreur pour une fixture IGES invalide', async ({ page }) => {
    await page.route('**/models/test.iges', (route) =>
      route.fulfill({ status: 200, body: 'not-an-iges-file' }),
    );
    await page.goto('/test/iges-viewer', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('cad-viewer-error')).toBeVisible({ timeout: 60_000 });
  });
});
