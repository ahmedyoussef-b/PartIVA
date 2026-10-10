import { test, expect } from '@playwright/test';

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

test.describe('Part dossier — onglets consolidés', () => {
  test('onglet Dossier accessible (informations générales)', async ({ page, request }) => {
    const partId = await getFirstPartId(request);
    await page.goto('/admin/pieces');

    await page.getByRole('button', { name: /Voir/ }).first().click();

    await expect(page.getByRole('tab', { name: 'Dossier' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Dossier' })).toHaveAttribute(
      'data-state',
      'active',
    );
    await expect(page.getByText('Dossier pièce')).toBeVisible();
  });

  test('onglet Mesures accessible', async ({ page, request }) => {
    const partId = await getFirstPartId(request);
    await page.goto('/admin/pieces');

    await page.getByRole('button', { name: /Voir/ }).first().click();
    await page.getByRole('tab', { name: 'Mesures' }).click();

    await expect(page.getByRole('tab', { name: 'Mesures' })).toHaveAttribute(
      'data-state',
      'active',
    );
    await expect(page.getByText('Mesures & spécifications')).toBeVisible();
  });

  test('onglet Documents accessible', async ({ page, request }) => {
    const partId = await getFirstPartId(request);
    await page.goto('/admin/pieces');

    await page.getByRole('button', { name: /Voir/ }).first().click();
    await page.getByRole('tab', { name: 'Documents' }).click();

    await expect(page.getByRole('tab', { name: 'Documents' })).toHaveAttribute(
      'data-state',
      'active',
    );
    await expect(page.getByText('Documents techniques')).toBeVisible();
  });

  test('onglet Historique accessible', async ({ page, request }) => {
    const partId = await getFirstPartId(request);
    await page.goto('/admin/pieces');

    await page.getByRole('button', { name: /Voir/ }).first().click();
    await page.getByRole('tab', { name: 'Historique' }).click();

    await expect(page.getByRole('tab', { name: 'Historique' })).toHaveAttribute(
      'data-state',
      'active',
    );
    await expect(page.getByText('Historique des versions')).toBeVisible();
  });

  test('onglet Images accessible', async ({ page, request }) => {
    const partId = await getFirstPartId(request);
    await page.goto('/admin/pieces');

    await page.getByRole('button', { name: /Voir/ }).first().click();
    await page.getByRole('tab', { name: 'Images' }).click();

    await expect(page.getByRole('tab', { name: 'Images' })).toHaveAttribute('data-state', 'active');
    const gallery = page.getByText('Photographies de la pièce');
    const empty = page.getByText('Aucune photo pour cette pièce.');
    await expect(gallery.or(empty).first()).toBeVisible();
  });
});
