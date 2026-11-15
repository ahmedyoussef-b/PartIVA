import { test, expect } from '@playwright/test';

test.describe('Workspace - panneaux rétractables', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'partiva-workspace-state',
        JSON.stringify({
          photos: [],
          cadFiles: [],
          dimensions: { unit: 'mm' },
          description: '',
          mode: 'quick',
          result: {
            success: true,
            ingest: {
              inputType: 'photo',
              analysisStatus: 'success',
              warnings: [],
              metadata: { fileCount: 1 },
            },
            search: { searchStatus: 'success', candidates: [] },
            reconstruct: {
              reconstructStatus: 'success',
              candidates: [{ fileUrl: 'https://example.com/model.stl' }],
              warnings: [],
            },
            archive: { archiveStatus: 'skipped' },
          },
        }),
      );
    });
    await page.goto('/workspace');
    await expect(page.getByRole('button', { name: 'Masquer Collecte' })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole('button', { name: 'Masquer Assistant' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('Collecte : masquer puis réafficher', async ({ page }) => {
    const viewport = page.locator('div.flex.min-h-0.flex-col.overflow-hidden');

    await expect(page.getByRole('heading', { name: /Collecte/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Masquer Collecte' })).toBeVisible();
    await expect(viewport).toHaveClass(/w-2\/4/);

    await page.getByRole('button', { name: 'Masquer Collecte' }).click();
    await expect(page.getByRole('button', { name: 'Collecte' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Collecte/i })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /Assistant IA/i })).toBeVisible();
    await expect(viewport).toHaveClass(/w-3\/4/);

    await page.getByRole('button', { name: 'Collecte' }).click();
    await expect(page.getByRole('button', { name: 'Masquer Collecte' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Collecte/i })).toBeVisible();
    await expect(viewport).toHaveClass(/w-2\/4/);
  });

  test('Assistant : masquer puis réafficher', async ({ page }) => {
    const viewport = page.locator('div.flex.min-h-0.flex-col.overflow-hidden');

    await expect(page.getByRole('heading', { name: /Assistant IA/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Masquer Assistant' })).toBeVisible();
    await expect(viewport).toHaveClass(/w-2\/4/);

    await page.getByRole('button', { name: 'Masquer Assistant' }).click();
    await expect(page.getByRole('button', { name: 'Assistant' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Assistant IA/i })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /Collecte/i })).toBeVisible();
    await expect(viewport).toHaveClass(/w-3\/4/);

    await page.getByRole('button', { name: 'Assistant' }).click();
    await expect(page.getByRole('button', { name: 'Masquer Assistant' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Assistant IA/i })).toBeVisible();
    await expect(viewport).toHaveClass(/w-2\/4/);
  });

  test('Les deux panneaux peuvent être masqués simultanément', async ({ page }) => {
    const viewport = page.locator('div.flex.min-h-0.flex-col.overflow-hidden');

    await page.getByRole('button', { name: 'Masquer Collecte' }).click();
    await page.getByRole('button', { name: 'Masquer Assistant' }).click();

    await expect(page.getByRole('button', { name: 'Collecte' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Assistant' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Collecte/i })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /Assistant IA/i })).not.toBeVisible();
    await expect(viewport).toHaveClass(/flex-1/);

    await page.getByRole('button', { name: 'Collecte' }).click();
    await page.getByRole('button', { name: 'Assistant' }).click();
    await expect(page.getByRole('heading', { name: /Collecte/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Assistant IA/i })).toBeVisible();
    await expect(viewport).toHaveClass(/w-2\/4/);
  });
});
