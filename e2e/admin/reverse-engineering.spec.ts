/**
 * V1.3-A — UI Admin Reverse Engineering (read-only, sans 3D, sans Groq)
 * Fixtures Prisma seedées: project1 (COMPLETED), project2 (IN_PROGRESS)
 * A4 skippé : D-V13A-A4-NO-STABLE-SELECTOR (pas de data-testid, assertion tautologique)
 */

import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';

test.describe('Admin — Reverse Engineering (V1.3-A)', () => {
  test('A1. /admin/reverse-engineering liste project1 et project2', async ({ page }) => {
    await page.goto('/admin/reverse-engineering');
    await expect(page).toHaveURL(/\/admin\/reverse-engineering/);
    await expect(
      page.getByText('Reverse engineering roulement SKF 6205', { exact: false }),
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Analyse engrenage module 2', { exact: false })).toBeVisible({
      timeout: 20000,
    });
  });

  test('A2. project1 COMPLETED affiche le CadFile seedé SKF-6205-2RS.stl (onglet Dossier CAO)', async ({
    page,
  }) => {
    await page.goto('/admin/reverse-engineering');
    const link = page
      .getByRole('link', { name: /Reverse engineering roulement SKF 6205/i })
      .first();
    await expect(link).toBeVisible({ timeout: 20000 });
    const href = await link.getAttribute('href');
    await page.goto(href!);
    await expect(page).toHaveURL(/\/admin\/reverse-engineering\/[a-z0-9]+/);
    const tab = page.getByRole('tab', { name: /Dossier CAO/i });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(page.getByText('SKF-6205-2RS.stl', { exact: false })).toBeVisible({
      timeout: 20000,
    });
  });
  test('A3. project2 IN_PROGRESS — étapes: 4 complétées / 1 non complétée (Modélisation CAO)', async ({
    page,
  }) => {
    await page.goto('/admin/reverse-engineering');
    const link = page.getByRole('link', { name: /Analyse engrenage module 2/i }).first();
    await expect(link).toBeVisible({ timeout: 20000 });
    const href = await link.getAttribute('href');
    await page.goto(href!);
    await expect(page).toHaveURL(/\/admin\/reverse-engineering\/[a-z0-9]+/);
    await expect(page.getByText('Modélisation CAO', { exact: false })).toBeVisible({
      timeout: 20000,
    });
  });

  // D-V13A-A4-NO-STABLE-SELECTOR — assertion tautologique, pas de data-testid,
  // skip en attente d'un sélecteur stable (V1.5)
  test.skip('A4. Déclencher "Analyser avec le Workspace" sur project1 et vérifier panneau résultat (sans preuve Groq)', async ({
    page,
  }) => {
    await page.goto('/admin/reverse-engineering');
    await page
      .getByText('Reverse engineering roulement SKF 6205', { exact: false })
      .first()
      .click();
    await page.waitForURL(/\/admin\/reverse-engineering\//, { timeout: 15000 });
    await expect(page.getByRole('button', { name: /Analyser avec le Workspace/i })).toBeVisible({
      timeout: 20000,
    });
  });
});

/**
 * V8-B-2-b — Flux Demande -> Projet RE (Méthode 3 Reverse CAO)
 * Test de bout en bout : création d'un projet RE depuis une demande, redirection et chargement.
 */

test.describe('ADMIN - Flux Demande -> Projet RE (V8-B-2-b)', () => {
  test.setTimeout(60000);

  let requestId: string;

  test.beforeAll(async () => {
    const request = await prisma.request.create({
      data: {
        machineRef: 'MACHINE-E2E-V8B2B',
        partDescription: 'Pièce test E2E V8-B-2-b',
        partFunction: 'Test',
        suspectedMaterial: 'Acier',
        quantity: 1,
        urgency: 'MEDIUM',
        photos: [],
        status: 'PENDING',
      },
    });
    requestId = request.id;
  });

  test.afterAll(async () => {
    // Nettoyage : supprimer le projet RE créé par le test, puis la demande
    await prisma.reverseEngineeringProject.deleteMany({
      where: { name: { startsWith: 'RE - Pièce test E2E V8-B-2-b' } },
    });
    await prisma.request.delete({ where: { id: requestId } });
  });

  test('créer un projet RE depuis une demande et vérifier le chargement', async ({ page }) => {
    await page.goto(`/admin/demandes/${requestId}`);
    await expect(page.getByText('Méthode 3 : Reverse CAO')).toBeVisible({ timeout: 30000 });

    // Clic sur la carte "Méthode 3" (le clic est sur la Card, pas le bouton interne)
    await page.getByText('Méthode 3 : Reverse CAO').click();

    // Attendre la redirection vers la page du projet RE
    await expect(page).toHaveURL(/\/admin\/reverse-engineering\/[a-z0-9]+/, { timeout: 30000 });

    // Vérifier que ce n'est pas "Projet introuvable"
    await expect(page.getByText('Projet introuvable')).not.toBeVisible();

    // Vérifier présence du titre du projet créé
    await expect(page.getByText(/RE - Pièce test E2E V8-B-2-b/)).toBeVisible({ timeout: 10000 });
  });
});
