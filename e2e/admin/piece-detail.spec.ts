import { test, expect } from '@playwright/test';

test.describe('E14-R4 — StlViewer (Three.js)', () => {
  test('StlViewer rend un canvas quand printableModelUrl est présent', async ({ page }) => {
    await page.goto('/admin/pieces/TD-001', { waitUntil: 'domcontentloaded' });
    // Le visualiseur 3D doit être présent (canvas WebGL)
    await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  });

  test('StlViewer affiche un fallback quand aucun modèle 3D', async ({ page, request }) => {
    // page.request partage le storageState admin (déjà authentifié via setup)
    const partsResp = await page.request.get('/api/parts');
    expect(partsResp.status()).toBe(200);
    const parts = await partsResp.json();
    const partWithoutModel = parts.find(
      (p: { printableModelUrl: string | null }) => !p.printableModelUrl,
    );
    expect(partWithoutModel).toBeTruthy();

    await page.goto(`/admin/pieces/${partWithoutModel.id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Aucun modèle 3D disponible')).toBeVisible();
  });

  test('StlViewer respecte la prop height', async ({ page }) => {
    await page.goto('/admin/pieces/TD-001', { waitUntil: 'domcontentloaded' });
    // Le conteneur du viewer doit être visible
    await expect(page.getByText('Visualiseur 3D')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  });
});

test.describe('E14-R5 — Intégration /admin/pieces/[id]', () => {
  test('Page détail affiche StlViewer quand printableModelUrl existe', async ({ page }) => {
    await page.goto('/admin/pieces/TD-001', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Visualiseur 3D')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  });

  test('Page détail affiche fallback quand aucun modèle 3D', async ({ page, request }) => {
    const partsResp = await page.request.get('/api/parts');
    expect(partsResp.status()).toBe(200);
    const parts = await partsResp.json();
    const partWithoutModel = parts.find(
      (p: { printableModelUrl: string | null }) => !p.printableModelUrl,
    );

    await page.goto(`/admin/pieces/${partWithoutModel.id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Aucun modèle 3D disponible')).toBeVisible();
    await expect(page.locator('canvas')).not.toBeVisible();
  });
});

test.describe('E16-R3 — Intégration ModelViewer (détection auto STEP/STL)', () => {
  test('Pièce STL (.stl) → StlViewer rendu, pas de CadViewer', async ({ page }) => {
    await page.goto('/admin/pieces/TD-001', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Visualiseur 3D')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('cad-viewer-canvas')).toHaveCount(0);
  });

  test('Pièce STEP (.step) → CadViewer rendu (canvas + cad-viewer-canvas)', async ({ page }) => {
    await page.goto('/admin/pieces/TD-STEP-001', { waitUntil: 'domcontentloaded' });
    // Le parsing STEP passe par un Web Worker : laisser le temps au worker WASM.
    await expect(page.getByTestId('cad-viewer-canvas')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('cad-viewer-error')).toHaveCount(0);
  });
});
