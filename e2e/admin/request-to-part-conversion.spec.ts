import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { accessMatrix } from '../fixtures/access-matrix';

/**
 * E20-Fix8 — Test E2E : conversion Demande → Pièce
 *
 * Scénario :
 * 1. Trouver une demande avec status === 'candidate_found'
 * 2. Vérifier que le bouton "Convertir en Pièce (admin)" est visible
 * 3. Cliquer sur le bouton
 * 4. Vérifier que la pièce a été créée et rediriger vers elle
 */

async function getCandidateRequestId(): Promise<string> {
  const requests = await prisma.request.findMany({
    where: { status: 'candidate_found' },
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: { id: true },
  });

  if (requests.length === 0) {
    throw new Error(
      'No request with status "candidate_found" found. Run the seed or create a request first.',
    );
  }

  return requests[0].id;
}

const staticRequestRoutes = accessMatrix.filter((r) => r.dynamicId === 'request');

for (const route of staticRequestRoutes) {
  if (route.ADMIN !== 'ALLOW') continue;

  test.describe(`ADMIN conversion demande → pièce — ${route.path}`, () => {
    test('affiche le bouton "Convertir en Pièce (admin)" pour une demande acceptée', async ({
      page,
    }) => {
      const requestId = await getCandidateRequestId();

      await page.goto(`/admin/demandes/${requestId}`);
      await expect(page).toHaveURL(/\/admin\/demandes\//, { timeout: 30_000 });

      const convertButton = page.getByRole('button', { name: /convertir en pièce/i });
      await expect(convertButton).toBeVisible({ timeout: 15_000 });
      await expect(convertButton).toBeEnabled();
    });

    test('crée la pièce et redirige vers la fiche ', async ({ page }) => {
      const requestId = await getCandidateRequestId();

      await page.goto(`/admin/demandes/${requestId}`);
      await expect(page).toHaveURL(/\/admin\/demandes\//, { timeout: 30_000 });

      const convertButton = page.getByRole('button', { name: /convertir en pièce/i });
      await convertButton.click();

      await page.waitForURL(/\/admin\/pieces\//, { timeout: 30_000 });

      await expect(page.getByRole('heading', { name: /pièce/i })).toBeVisible();
    });

    test('la pièce créée affiche l\'onglet "Images" avec les photos de la demande', async ({
      page,
    }) => {
      const requestId = await getCandidateRequestId();

      await page.goto(`/admin/demandes/${requestId}`);
      await expect(page).toHaveURL(/\/admin\/demandes\//, { timeout: 30_000 });

      const convertButton = page.getByRole('button', { name: /convertir en pièce/i });
      await convertButton.click();

      await page.waitForURL(/\/admin\/pieces\//, { timeout: 30_000 });

      // Aller sur l'onglet Images
      await page.getByRole('tab', { name: /images/i }).click();

      // Vérifier que l'onglet images est actif et contient des images
      await expect(page.getByRole('tab', { name: /images/i })).toBeFocused();
      await expect(page.getByTestId('gallery-grid')).toBeVisible();
      // Le composant PartImageGallery génère un <img /> pour chaque image
      await expect(page.locator('img')).toHaveCount({ minimum: 1 });
    });
  });
}
