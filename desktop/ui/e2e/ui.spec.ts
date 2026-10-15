import { test, expect } from '@playwright/test';

/**
 * E8P-S08 — Mock des commandes Tauri en headless (Bloc H).
 * Tauri 2 : @tauri-apps/api/core appelle window.__TAURI_INTERNALS__.invoke.
 * On mocke également window.__TAURI__ par sécurité.
 */
const TAURI_MOCK = () => {
  const PARTS = [
    {
      id: 'p1',
      part_number: 'PTV-ROU-001',
      name: 'Roulement à billes',
      category_id: 'c1',
      material: 'Acier',
      status: 'DRAFT',
      updated_at: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'p2',
      part_number: 'PTV-JOI-002',
      name: 'Joint torique',
      category_id: null,
      material: 'Caoutchouc',
      status: 'DRAFT',
      updated_at: '2026-01-03T00:00:00.000Z',
    },
  ];

  const invoke = async (cmd: string, args: Record<string, unknown>) => {
    switch (cmd) {
      case 'load_token':
        return 'fake-token';
      case 'sync_now':
        return { tables_synced: 7, rows_total: 1521, duration_ms: 42 };
      case 'list_parts':
        return (args.offset as number) === 0 ? PARTS : [];
      case 'search_parts': {
        const q = String(args.query ?? '').toLowerCase();
        if (!q) return PARTS;
        return PARTS.filter((p) => p.name.toLowerCase().includes(q));
      }
      case 'get_part':
        return {
          part: { ...PARTS[0], description: 'Roulement à billes étanche' },
          specifications: [{ key: 'diametre', value: '52', unit: 'mm' }],
          images: [
            {
              url: 'https://res.cloudinary.com/demo/roulement.jpg',
              alt_text: 'Roulement',
              is_primary: 1,
            },
          ],
          fitments: [{ vehicle_make: 'Renault', vehicle_model: 'Clio', vehicle_year: 2010 }],
        };
      default:
        throw new Error(`commande non mockée : ${cmd}`);
    }
  };

  (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = { invoke };
  (window as unknown as { __TAURI__: unknown }).__TAURI__ = { core: { invoke }, invoke };
};

async function gotoWithTauri(page: import('@playwright/test').Page, path: string) {
  await page.addInitScript(TAURI_MOCK);
  await page.goto(path);
}

test.describe('E8P-S08 — UI desktop headless', () => {
  test('H.1 — page d accueil redirige vers /catalogue (token mocké)', async ({ page }) => {
    await gotoWithTauri(page, '/');
    await expect(page).toHaveURL(/\/catalogue\/$/, { timeout: 15_000 });
  });

  test('H.1 — /login affiche email + password + bouton', async ({ page }) => {
    await gotoWithTauri(page, '/login/');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Connexion PartIVA');
  });

  test('H.2 — /catalogue affiche le tableau des pièces mockées', async ({ page }) => {
    await gotoWithTauri(page, '/catalogue/');
    await expect(page.locator('h1')).toHaveText('Catalogue');
    await expect(page.locator('table.parts-table tbody tr')).toHaveCount(2);
    await expect(page.locator('table.parts-table tbody tr').first()).toContainText(
      'Roulement à billes',
    );
  });

  test('H.3 — /recherche affiche les 6 modes', async ({ page }) => {
    await gotoWithTauri(page, '/recherche/');
    await expect(page.locator('h1')).toHaveText('Recherche');
    const options = await page.locator('select option').allTextContents();
    expect(options).toEqual([
      'Référence',
      'Nom',
      'Catégorie',
      'Matière',
      'Véhicule',
      'Spécifications',
    ]);
  });

  test('H.3 — recherche par nom retourne le résultat mocké', async ({ page }) => {
    await gotoWithTauri(page, '/recherche/');
    await page.locator('select').selectOption('name');
    await page.locator('input').fill('Roulement');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('table.parts-table tbody tr')).toHaveCount(1);
    await expect(page.locator('table.parts-table tbody tr')).toContainText('Roulement à billes');
  });

  test('H.4 — /part?id=p1 affiche la fiche mockée (détails + specs + fitments)', async ({
    page,
  }) => {
    await gotoWithTauri(page, '/part/?id=p1');
    await expect(page.locator('h1')).toContainText('Roulement à billes');
    await expect(page.getByText('diametre')).toBeVisible();
    await expect(page.getByText('52 mm')).toBeVisible();
    await expect(page.getByText('Renault Clio (2010)')).toBeVisible();
  });

  test('H.5 — /part sans id affiche un message d erreur', async ({ page }) => {
    await gotoWithTauri(page, '/part/');
    await expect(page.locator('.error')).toContainText('Identifiant de pièce manquant');
  });

  test('H.6 — l indicateur de sync affiche "Sync à jour" (mock)', async ({ page }) => {
    await gotoWithTauri(page, '/catalogue/');
    await expect(page.locator('.sync-status')).toHaveText('Sync à jour', { timeout: 15_000 });
  });
});
