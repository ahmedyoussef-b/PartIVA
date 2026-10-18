import { test, expect } from '@playwright/test';

const BASE_URL = 'https://part-iva.vercel.app';

const pages = [
  { path: '/admin/dashboard', name: 'Admin Dashboard' },
  { path: '/admin/demandes', name: 'Admin Demandes' },
  { path: '/admin/materiaux', name: 'Admin Matériaux' },
  { path: '/admin/audit', name: 'Admin Audit' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' },
];

for (const { path, name } of pages) {
  test(`${name} — accessible (200 ou redirection /login)`, async ({ page }) => {
    const response = await page.goto(`${BASE_URL}${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    expect(response?.status()).toBe(200);
    // En web sans session, les pages admin redirigent vers /login (prévu §5.1)
    expect(page.url()).toMatch(new RegExp(`${path}|/login`));
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('h1, h2, h3, [role="heading"]').first()).toBeVisible();
  });
}

test('Healthcheck API', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/api/health`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('ok');
});

test('Login — redirection ou formulaire', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
