import { test, expect } from '@playwright/test';

/**
 * Tests UI complétude (E4-S04, D-completeness-client-ui).
 *
 * Le badge de complétude (CompletenessBadge) est affiché dans
 * le dossier pièce (PartDossier) — accessible depuis
 * /admin/pieces via le bouton "Voir".
 * Les données proviennent de GET /api/parts/[id]/completeness.
 *
 * Projet admin (storageState) — R.5.8.
 */

async function getFirstPartId(
  request: import('@playwright/test').APIRequestContext,
): Promise<string> {
  const response = await request.get('/api/parts');
  expect(response.status()).toBe(200);
  const parts = await response.json();
  expect(Array.isArray(parts)).toBe(true);
  expect(parts.length).toBeGreaterThan(0);
  return parts[0].id as string;
}

test.describe('Complétude UI (E4-S04)', () => {
  test('barre de complétude affichée dans le dossier pièce', async ({ page, request }) => {
    await getFirstPartId(request);
    await page.goto('/admin/pieces');

    await page.getByRole('button', { name: /Voir/ }).first().click();

    await expect(page.getByText('Dossier pièce')).toBeVisible();
    const progressbar = page.getByRole('progressbar');
    await expect(progressbar).toBeVisible({ timeout: 15_000 });
    await expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    await expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  test('badge complétude affiche un pourcentage valide', async ({ page, request }) => {
    await getFirstPartId(request);
    await page.goto('/admin/pieces');

    await page.getByRole('button', { name: /Voir/ }).first().click();

    await expect(page.getByText('Dossier pièce')).toBeVisible();
    const progressbar = page.getByRole('progressbar');
    await expect(progressbar).toBeVisible({ timeout: 15_000 });
    const valuenow = await progressbar.getAttribute('aria-valuenow');
    expect(valuenow).not.toBeNull();
    const pct = Number(valuenow);
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
    await expect(page.getByText(`${pct} %`).first()).toBeVisible();
  });
});
