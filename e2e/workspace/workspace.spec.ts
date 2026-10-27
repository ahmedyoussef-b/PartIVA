import { test, expect } from '@playwright/test';

const baseResult = {
  success: true,
  ingest: { inputType: 'photo', analysisStatus: 'success', warnings: [], metadata: { fileCount: 1 } },
  search: { searchStatus: 'success', candidates: [] },
  reconstruct: { reconstructStatus: 'failed', candidates: [], warnings: [] },
  archive: { archiveStatus: 'skipped' },
};

test.describe('Workspace page', () => {
  test('loads with three zones', async ({ page }) => {
    await page.goto('/workspace');
    await expect(page.getByRole('heading', { name: /Collecte/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Assistant IA/i })).toBeVisible();
    await expect(page.getByText(/Aucun mod.le 3D disponible/i)).toBeVisible();
  });

  test('analyse button present and clickable', async ({ page }) => {
    await page.goto('/workspace');
    const btn = page.getByRole('button', { name: /Analyser/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('placeholder visible initially', async ({ page }) => {
    await page.goto('/workspace');
    await expect(page.getByText(/Aucun mod.le 3D disponible/i)).toBeVisible();
  });

  test('submit ingestion form triggers analyse', async ({ page }) => {
    await page.route('**/api/engine', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(baseResult) });
    });
    await page.goto('/workspace');
    await page.getByPlaceholder('Description').fill('test part');
    await page.getByPlaceholder('Longueur').fill('10');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect(page.getByText(/Ingestion: photo/i)).toBeVisible();
  });

  test('assistant shows ingestion warnings', async ({ page }) => {
    const result = { ...baseResult, ingest: { ...baseResult.ingest, warnings: ['Aucune dimension fournie'] } };
    await page.route('**/api/engine', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) });
    });
    await page.goto('/workspace');
    await page.getByPlaceholder('Description').fill('test part');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect(page.getByText('Aucune dimension fournie')).toBeVisible();
  });

  test('deep mode sends mode deep', async ({ page }) => {
    let body: any;
    await page.route('**/api/engine', async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(baseResult) });
    });
    await page.goto('/workspace');
    await page.getByRole('combobox').nth(1).selectOption('deep');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect.poll(() => body?.mode).toBe('deep');
  });

  test('search results display two candidates', async ({ page }) => {
    const result = { ...baseResult, search: { searchStatus: 'success', candidates: [{ partNumber: 'P1', score: 0.85 }, { partNumber: 'P2', score: 0.72 }] } };
    await page.route('**/api/engine', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) });
    });
    await page.goto('/workspace');
    await page.getByPlaceholder('Description').fill('test part');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect(page.getByText(/R.sultats recherche \(2\)/i)).toBeVisible();
    await expect(page.getByText(/0.85/)).toBeVisible();
    await expect(page.getByText(/0.72/)).toBeVisible();
  });

  test('empty search shows not found', async ({ page }) => {
    const result = { ...baseResult, search: { searchStatus: 'not_found', candidates: [] } };
    await page.route('**/api/engine', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) });
    });
    await page.goto('/workspace');
    await page.getByPlaceholder('Description').fill('test part');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect(page.getByText(/Recherche: not_found/i)).toBeVisible();
  });

  test('quick mode sends mode quick', async ({ page }) => {
    let body: any;
    await page.route('**/api/engine', async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(baseResult) });
    });
    await page.goto('/workspace');
    await page.getByRole('combobox').nth(1).selectOption('quick');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect.poll(() => body?.mode).toBe('quick');
  });

  test('deep mode triggers engine with deep', async ({ page }) => {
    let body: any;
    await page.route('**/api/engine', async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(baseResult) });
    });
    await page.goto('/workspace');
    await page.getByRole('combobox').nth(1).selectOption('deep');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect.poll(() => body?.mode).toBe('deep');
  });

  test('reconstruct success shows 3d viewer', async ({ page }) => {
    const result = { ...baseResult, reconstruct: { reconstructStatus: 'success', candidates: [{ fileUrl: 'https://example.com/model.stl' }], warnings: [] } };
    await page.route('**/api/engine', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) });
    });
    await page.goto('/workspace');
    await page.getByPlaceholder('Description').fill('test part');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect(page.getByText(/Aucun mod.le 3D disponible/i)).not.toBeVisible();
  });

  test('reconstruct partial shows placeholder and warning', async ({ page }) => {
    const result = { ...baseResult, reconstruct: { reconstructStatus: 'partial', candidates: [], warnings: [] } };
    await page.route('**/api/engine', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) });
    });
    await page.goto('/workspace');
    await page.getByPlaceholder('Description').fill('test part');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect(page.getByText(/Reconstruction: partial/i)).toBeVisible();
  });

  test('archive success shows archived', async ({ page }) => {
    const result = { ...baseResult, archive: { archiveStatus: 'success', archivedPartId: 'test-id' } };
    await page.route('**/api/engine', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) });
    });
    await page.goto('/workspace');
    await page.getByPlaceholder('Description').fill('test part');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect(page.getByText(/Archivage:/i)).toBeVisible();
  });

  test('archive partial shows draft', async ({ page }) => {
    const result = { ...baseResult, archive: { archiveStatus: 'partial' } };
    await page.route('**/api/engine', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) });
    });
    await page.goto('/workspace');
    await page.getByPlaceholder('Description').fill('test part');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect(page.getByText(/Archivage:/i)).toBeVisible();
  });

  test('cadviewer for step', async ({ page }) => {
    const result = { ...baseResult, reconstruct: { reconstructStatus: 'success', candidates: [{ fileUrl: 'https://example.com/model.step' }], warnings: [] } };
    await page.route('**/api/engine', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) });
    });
    await page.goto('/workspace');
    await page.getByPlaceholder('Description').fill('test part');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect(page.getByText(/Aucun mod.le 3D disponible/i)).not.toBeVisible();
  });

  test('modelviewer for stl', async ({ page }) => {
    const result = { ...baseResult, reconstruct: { reconstructStatus: 'success', candidates: [{ fileUrl: 'https://example.com/model.stl' }], warnings: [] } };
    await page.route('**/api/engine', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) });
    });
    await page.goto('/workspace');
    await page.getByPlaceholder('Description').fill('test part');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect(page.getByText(/Aucun mod.le 3D disponible/i)).not.toBeVisible();
  });

  test('placeholder when no fileurl', async ({ page }) => {
    const result = { ...baseResult, reconstruct: { reconstructStatus: 'partial', candidates: [], warnings: [] } };
    await page.route('**/api/engine', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) });
    });
    await page.goto('/workspace');
    await page.getByPlaceholder('Description').fill('test part');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect(page.getByText(/Aucun mod.le 3D disponible/i)).toBeVisible();
  });
});
