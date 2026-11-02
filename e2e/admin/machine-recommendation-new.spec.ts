import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

test.describe('E97-B2 — MachineRecommendationPanel', () => {
  let partId: string;

  test('état vide — aucune recommandation', async ({ page }) => {
    const env = {
      ...process.env,
      DATABASE_URL: 'postgresql://postgres:66023@localhost:5432/partiva_test?schema=public',
    };

    // 1. Créer une part sans matériau
    const out = execSync(
      `npx tsx e2e/fixtures/create-submitted-part.mts "E2E-EMPTY-${Date.now()}" "Pièce vide"`,
      { encoding: 'utf8', env },
    );
    partId = JSON.parse(out.trim()).id;

    // 2. Naviguer vers la fiche de la pièce
    await page.goto(`/admin/pieces/${partId}`, { waitUntil: 'domcontentloaded' });

    // 3. Cliquer sur l'onglet 'Dossier'
    await page.getByRole('tab', { name: /dossier/i }).click();

    // 4. Vérifier que l'état vide est visible
    await expect(page.getByTestId('machine-recommendation-empty')).toBeVisible({ timeout: 30_000 });
  });

  test('recommandation disponible — machine CNC', async ({ page }) => {
    const env = {
      ...process.env,
      DATABASE_URL: 'postgresql://postgres:66023@localhost:5432/partiva_test?schema=public',
      DATABASE_URL_UNPOOLED:
        'postgresql://postgres:66023@localhost:5432/partiva_test?schema=public',
      DIRECT_URL: 'postgresql://postgres:66023@localhost:5432/partiva_test?schema=public',
    };

    // 1. Créer une part sans matériau
    const out = execSync(
      `npx tsx e2e/fixtures/create-submitted-part.mts "E2E-REC-${Date.now()}" "Pièce POM"`,
      { encoding: 'utf8', env },
    );
    partId = JSON.parse(out.trim()).id;

    // 2. Mettre à jour le matériau = 'POM' via Prisma
    execSync(
      `npx prisma db execute --url "postgresql://postgres:66023@localhost:5432/partiva_test?schema=public" --stdin`,
      {
        input: `UPDATE "Part" SET material = 'POM' WHERE id = '${partId}';`,
        encoding: 'utf8',
        env,
      },
    );

    // 3. Naviguer et cliquer sur l'onglet 'Dossier'
    await page.goto(`/admin/pieces/${partId}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: /dossier/i }).click();

    // 4. Vérifier la carte machine
    await expect(page.getByTestId('machine-recommendation-card')).toBeVisible({ timeout: 30_000 });
  });
});
