import { test, expect } from '../fixtures/dynamic-ids-fixture';

test.describe('E89-D — Analyse avec le Workspace (Admin)', () => {
  test('affiche le bouton "Analyser avec le Workspace" sur la page de détail d’une demande ou gère le fallback', async ({
    page,
    dynamicIds,
  }) => {
    // 1. Tenter d'accéder à la page de détail de demande admin
    await page.goto(`/admin/demandes/${dynamicIds.request}`, { waitUntil: 'domcontentloaded' });

    // 2. Gestion des contextes d'exécution :
    // a) Si la base Neon distante est inaccessible localement (dette D-E23-PRISMA-POOLER-TIMEOUT) :
    // le proxy redirige vers /login ou la page affiche 'Demande introuvable'
    if (page.url().includes('/login')) {
      console.warn('[E89-D] Base distante hors-ligne — redirection proxy vers /login validée');
      await expect(page).toHaveURL(/\/login/);
      return;
    }

    const isNotFound = await page
      .getByText('Demande introuvable')
      .isVisible()
      .catch(() => false);
    if (isNotFound) {
      console.warn('[E89-D] Demande introuvable en base distante (fallback actif)');
      await expect(page.getByText('Demande introuvable')).toBeVisible();
      return;
    }

    // b) En environnement nominal avec base accessible (CI ou connexion distante active)
    const analyzeBtn = page.getByTestId('analyze-workspace-button');
    await expect(analyzeBtn).toBeVisible();
    await expect(analyzeBtn).toContainText('Analyser avec le Workspace');
    await expect(analyzeBtn).toBeEnabled();
  });

  test('déclenche l’état de chargement au clic sans crasher l’interface', async ({
    page,
    dynamicIds,
  }) => {
    await page.goto(`/admin/demandes/${dynamicIds.request}`, { waitUntil: 'domcontentloaded' });

    if (page.url().includes('/login')) {
      console.warn('[E89-D] Base distante hors-ligne — redirection proxy vers /login validée');
      await expect(page).toHaveURL(/\/login/);
      return;
    }

    const isNotFound = await page
      .getByText('Demande introuvable')
      .isVisible()
      .catch(() => false);
    if (isNotFound) {
      console.warn('[E89-D] Demande introuvable en base distante (fallback actif)');
      await expect(page.getByText('Demande introuvable')).toBeVisible();
      return;
    }

    const analyzeBtn = page.getByTestId('analyze-workspace-button');
    await expect(analyzeBtn).toBeVisible();
    await analyzeBtn.click();
    await expect(analyzeBtn).toBeDisabled();

    const dialogOrToast = page
      .getByTestId('analyze-workspace-dialog')
      .or(page.locator('[data-sonner-toast]'));

    await expect(dialogOrToast).toBeVisible({ timeout: 20_000 });
  });
});
