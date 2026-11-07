// e2e/admin/export-pdf.spec.ts
import { test, expect } from '@playwright/test';

test('Exporter PDF sur la page détail pièce', async ({ page }) => {
  await page.goto('/admin/pieces');

  await page.waitForLoadState('networkidle');

  const firstLink = page
    .locator('a[href^="/admin/pieces/"]:not([href="/admin/pieces/nouveau"])')
    .first();
  const href = await firstLink.getAttribute('href');
  expect(href).toBeTruthy();
  expect(href).toMatch(/^\/admin\/pieces\/[a-zA-Z0-9-]+$/);

  await page.goto(href!);

  const btn = page.getByTestId('export-pdf-button');
  await expect(btn).toBeVisible({ timeout: 10000 });

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    btn.click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/^partiva-.*\.pdf$/);
});
